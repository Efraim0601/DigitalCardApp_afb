package com.afriland.cardyo.service;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.ImportResultDto;
import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.entity.LabelEntity;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.repository.DepartmentRepository;
import com.afriland.cardyo.repository.JobTitleRepository;
import com.afriland.cardyo.repository.LabelEntityRepository;
import com.afriland.cardyo.util.PhoneFormatter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.text.Normalizer;
import java.util.*;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class DataImportService {

    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;
    private final CardRepository cardRepository;
    private final AppProperties appProperties;

    public ImportResultDto importData(MultipartFile file, String scope) throws IOException {
        return importData(file, scope, "overwrite");
    }

    @Transactional
    public ImportResultDto importData(MultipartFile file, String scope, String onConflict) throws IOException {
        String filename = file.getOriginalFilename();
        boolean isCsv = filename != null && filename.toLowerCase().endsWith(".csv");

        List<Map<String, String>> rows = isCsv
                ? parseCsv(file.getInputStream())
                : parseExcel(file.getInputStream(), filename);

        List<String> warnings = new ArrayList<>();
        int deptCount = 0, jtCount = 0, cardCount = 0;

        switch (scope) {
            case "departments" -> {
                if (rows.size() > 5000)
                    throw new IllegalArgumentException("Max 5 000 rows for departments");
                deptCount = importLabels(rows, departmentRepository, Department::new, warnings);
            }
            case "job_titles" -> {
                if (rows.size() > 5000)
                    throw new IllegalArgumentException("Max 5 000 rows for job_titles");
                jtCount = importLabels(rows, jobTitleRepository, JobTitle::new, warnings);
            }
            case "cards" -> {
                if (rows.size() > 20000)
                    throw new IllegalArgumentException("Max 20 000 rows for cards");
                cardCount = importCards(rows, warnings, "ignore".equalsIgnoreCase(onConflict));
            }
            default -> throw new IllegalArgumentException("Invalid scope: " + scope);
        }

        return ImportResultDto.builder()
                .success(true)
                .imported(ImportResultDto.ImportCounts.builder()
                        .departments(deptCount).jobTitles(jtCount).cards(cardCount)
                        .build())
                .warnings(warnings)
                .build();
    }

    // ---- label import (generic for departments & job_titles) ----

    private <T extends LabelEntity> int importLabels(
            List<Map<String, String>> rows,
            LabelEntityRepository<T> repository,
            Supplier<T> factory,
            List<String> warnings) {

        int count = 0;
        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> row = rows.get(i);
            String labelFr = getField(row, "label_fr", "labelfr", "label");
            String labelEn = getField(row, "label_en", "labelen");

            if (labelFr == null || labelFr.isBlank()) {
                warnings.add("Row " + (i + 2) + ": missing label_fr, skipped");
                continue;
            }
            if (labelEn == null || labelEn.isBlank()) {
                labelEn = labelFr;
            }

            Optional<T> existing = repository.findByLabelFrIgnoreCase(labelFr.trim());
            if (existing.isEmpty()) {
                existing = repository.findByLabelEnIgnoreCase(labelEn.trim());
            }

            T entity = existing.orElseGet(factory);
            entity.setLabelFr(labelFr.trim());
            entity.setLabelEn(labelEn.trim());
            repository.save(entity);
            count++;
        }
        return count;
    }

    // ---- cards import ----

    private int importCards(List<Map<String, String>> rows, List<String> warnings, boolean ignoreExisting) {
        int count = 0;
        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> row = rows.get(i);
            String email = getField(row, "email");
            if (email == null || email.isBlank()) {
                warnings.add("Row " + (i + 2) + ": missing email, skipped");
                continue;
            }

            String normalizedEmail = email.toLowerCase().trim();
            if (ignoreExisting && cardRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                warnings.add("Row " + (i + 2) + ": '" + email + "' already exists, skipped");
                continue;
            }

                UUID departmentId = resolveDepartment(row, warnings, i);
                UUID jobTitleId = resolveJobTitle(row, warnings, i);
            String mobile = PhoneFormatter.format(
                    getField(row, "mobile", "telephone_mobile", "tel_mobile"));
                String title = getField(row, "title", "titre", "poste");

            cardRepository.upsertByEmail(
                    normalizedEmail,
                    getField(row, "first_name", "firstname", "prenom"),
                    getField(row, "last_name", "lastname", "nom"),
                    getField(row, "company", "entreprise", "societe"),
                    title,
                    appProperties.getCard().getFixedPhone(),
                    appProperties.getCard().getFixedFax(),
                    mobile,
                    departmentId,
                    jobTitleId);
            count++;
        }
        return count;
    }

    private UUID resolveDepartment(Map<String, String> row,
                                   List<String> warnings, int rowIdx) {
        return resolveLabel(row, warnings, rowIdx, "department",
                departmentRepository, Department::new,
                "department", "direction", "department_fr", "departement");
    }

    private UUID resolveJobTitle(Map<String, String> row,
                                 List<String> warnings, int rowIdx) {
        return resolveLabel(row, warnings, rowIdx, "job title",
                jobTitleRepository, JobTitle::new,
                "job_title", "jobtitle", "titre_poste", "titreposte", "poste");
    }

    private <T extends LabelEntity> UUID resolveLabel(
            Map<String, String> row,
            List<String> warnings,
            int rowIdx,
            String kind,
            LabelEntityRepository<T> repository,
            Supplier<T> factory,
            String... fieldKeys) {
        String label = getField(row, fieldKeys);
        if (label == null || label.isBlank()) return null;
        String normalizedLabel = label.trim();

        Optional<T> found = repository.findByLabelFrIgnoreCase(normalizedLabel);
        if (found.isEmpty()) found = repository.findByLabelEnIgnoreCase(normalizedLabel);
        if (found.isEmpty()) {
            T created = factory.get();
            created.setLabelFr(normalizedLabel);
            created.setLabelEn(normalizedLabel);
            found = Optional.of(repository.save(created));
            warnings.add("Row " + (rowIdx + 2)
                    + ": " + kind + " '" + normalizedLabel + "' created automatically");
        }
        return found.get().getId();
    }

    // ---- parsing helpers ----

    private List<Map<String, String>> parseCsv(InputStream is) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        List<Map<String, String>> rows = new ArrayList<>();
        String headerLine = reader.readLine();
        if (headerLine == null) return rows;

        if (headerLine.startsWith("\uFEFF")) {
            headerLine = headerLine.substring(1);
        }

        String[] headers = splitCsvLine(headerLine);
        for (int i = 0; i < headers.length; i++) {
            headers[i] = normalizeHeader(headers[i]);
        }

        String line;
        while ((line = reader.readLine()) != null) {
            if (line.isBlank()) continue;
            String[] values = splitCsvLine(line);
            Map<String, String> row = new HashMap<>();
            for (int i = 0; i < headers.length && i < values.length; i++) {
                row.put(headers[i], values[i].trim());
            }
            rows.add(row);
        }
        return rows;
    }

    private String[] splitCsvLine(String line) {
        char separator = line.contains(";") ? ';' : ',';
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder field = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == separator && !inQuotes) {
                fields.add(field.toString());
                field = new StringBuilder();
            } else {
                field.append(c);
            }
        }
        fields.add(field.toString());
        return fields.toArray(new String[0]);
    }

    private List<Map<String, String>> parseExcel(InputStream is, String filename)
            throws IOException {
        Workbook workbook = (filename != null && filename.toLowerCase().endsWith(".xls"))
                ? new HSSFWorkbook(is)
                : new XSSFWorkbook(is);

        Sheet sheet = workbook.getSheetAt(0);
        List<Map<String, String>> rows = new ArrayList<>();

        Row headerRow = sheet.getRow(0);
        if (headerRow == null) { workbook.close(); return rows; }

        String[] headers = new String[headerRow.getLastCellNum()];
        for (int i = 0; i < headers.length; i++) {
            headers[i] = normalizeHeader(getCellString(headerRow.getCell(i)));
        }

        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            Map<String, String> map = new HashMap<>();
            for (int c = 0; c < headers.length; c++) {
                map.put(headers[c], getCellString(row.getCell(c)));
            }
            rows.add(map);
        }

        workbook.close();
        return rows;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                yield (v == Math.floor(v)) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private String normalizeHeader(String header) {
        if (header == null) return "";
        String s = Normalizer.normalize(header.trim().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_", "")
                .replaceAll("_$", "");
        return s;
    }

    private String getField(Map<String, String> row, String... keys) {
        for (String key : keys) {
            String value = row.get(key);
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }
}
