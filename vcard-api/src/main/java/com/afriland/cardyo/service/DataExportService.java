package com.afriland.cardyo.service;

import com.afriland.cardyo.entity.Card;
import com.afriland.cardyo.entity.LabelEntity;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.repository.DepartmentRepository;
import com.afriland.cardyo.repository.JobTitleRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DataExportService {

    private static final String[] CARD_HEADERS = {
            "email", "first_name", "last_name", "company",
            "title", "phone", "fax", "mobile",
            "department_fr", "department_en", "job_title_fr", "job_title_en"
    };

    private static final String[] LABEL_HEADERS = { "label_fr", "label_en" };

    private final CardRepository cardRepository;
    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;

    public byte[] exportCsv(String scope) {
        return switch (scope) {
            case "cards"       -> exportCards();
            case "departments" -> exportDepartments();
            case "job_titles"  -> exportJobTitles();
            default -> throw new IllegalArgumentException("Invalid scope: " + scope);
        };
    }

    public byte[] exportXlsx(String scope) {
        return switch (scope) {
            case "cards"       -> exportCardsXlsx();
            case "departments" -> exportDepartmentsXlsx();
            case "job_titles"  -> exportJobTitlesXlsx();
            default -> throw new IllegalArgumentException("Invalid scope: " + scope);
        };
    }

    public byte[] exportTemplateXlsx(String scope) {
        return switch (scope) {
            case "cards"       -> buildTemplateXlsx("Cartes", CARD_HEADERS, sampleCardRow());
            case "departments" -> buildTemplateXlsx("Directions", LABEL_HEADERS,
                    new String[]{"Direction Financière", "Financial Department"});
            case "job_titles"  -> buildTemplateXlsx("Titres-Postes", LABEL_HEADERS,
                    new String[]{"Ingénieur", "Engineer"});
            default -> throw new IllegalArgumentException("Invalid scope: " + scope);
        };
    }

    public String getFilename(String scope) {
        return switch (scope) {
            case "cards"       -> "cartes.csv";
            case "departments" -> "directions.csv";
            case "job_titles"  -> "titres-postes.csv";
            default -> "export.csv";
        };
    }

    public String getXlsxFilename(String scope) {
        return switch (scope) {
            case "cards"       -> "cartes.xlsx";
            case "departments" -> "directions.xlsx";
            case "job_titles"  -> "titres-postes.xlsx";
            default -> "export.xlsx";
        };
    }

    public String getTemplateFilename(String scope) {
        return switch (scope) {
            case "cards"       -> "modele-cartes.xlsx";
            case "departments" -> "modele-directions.xlsx";
            case "job_titles"  -> "modele-titres-postes.xlsx";
            default -> "modele.xlsx";
        };
    }

    // ---- CSV exports ----

    private byte[] exportCards() {
        List<Card> cards = cardRepository.findAll(Sort.by("createdAt").descending());
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = csvWriter(baos);

        w.println(csvLine(CARD_HEADERS));

        for (Card c : cards) {
            w.println(csvLine(cardRow(c)));
        }
        w.flush();
        return baos.toByteArray();
    }

    private byte[] exportDepartments() {
        return exportLabels(departmentRepository.findAll(Sort.by("createdAt").descending()));
    }

    private byte[] exportJobTitles() {
        return exportLabels(jobTitleRepository.findAll(Sort.by("createdAt").descending()));
    }

    private byte[] exportLabels(List<? extends LabelEntity> rows) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = csvWriter(baos);
        w.println(csvLine(LABEL_HEADERS));
        for (LabelEntity l : rows) {
            w.println(csvLine(nullSafe(l.getLabelFr()), nullSafe(l.getLabelEn())));
        }
        w.flush();
        return baos.toByteArray();
    }

    // ---- Excel (.xlsx) exports ----

    private byte[] exportCardsXlsx() {
        List<Card> cards = cardRepository.findAll(Sort.by("createdAt").descending());
        return buildXlsx("Cartes", CARD_HEADERS, cards.stream().map(this::cardRow).toList());
    }

    private byte[] exportDepartmentsXlsx() {
        return buildLabelsXlsx("Directions",
                departmentRepository.findAll(Sort.by("createdAt").descending()));
    }

    private byte[] exportJobTitlesXlsx() {
        return buildLabelsXlsx("Titres-Postes",
                jobTitleRepository.findAll(Sort.by("createdAt").descending()));
    }

    private byte[] buildLabelsXlsx(String sheetName, List<? extends LabelEntity> rows) {
        List<String[]> data = rows.stream()
                .map(l -> new String[]{ nullSafe(l.getLabelFr()), nullSafe(l.getLabelEn()) })
                .toList();
        return buildXlsx(sheetName, LABEL_HEADERS, data);
    }

    private byte[] buildXlsx(String sheetName, String[] headers, List<String[]> rows) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(sheetName);
            writeHeader(wb, sheet, headers);
            for (int i = 0; i < rows.size(); i++) {
                Row r = sheet.createRow(i + 1);
                String[] values = rows.get(i);
                for (int c = 0; c < values.length; c++) {
                    r.createCell(c).setCellValue(values[c] == null ? "" : values[c]);
                }
            }
            autoSize(sheet, headers.length);
            sheet.createFreezePane(0, 1);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private byte[] buildTemplateXlsx(String sheetName, String[] headers, String[] sampleRow) {
        return buildXlsx(sheetName, headers, List.<String[]>of(sampleRow));
    }

    private void writeHeader(Workbook wb, Sheet sheet, String[] headers) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        Row header = sheet.createRow(0);
        for (int c = 0; c < headers.length; c++) {
            Cell cell = header.createCell(c);
            cell.setCellValue(headers[c]);
            cell.setCellStyle(style);
        }
    }

    private void autoSize(Sheet sheet, int columnCount) {
        for (int c = 0; c < columnCount; c++) {
            sheet.autoSizeColumn(c);
            int width = Math.min(sheet.getColumnWidth(c) + 512, 60 * 256);
            sheet.setColumnWidth(c, width);
        }
    }

    // ---- shared helpers ----

    private String[] cardRow(Card c) {
        String dFr = c.getDepartment() != null ? nullSafe(c.getDepartment().getLabelFr()) : "";
        String dEn = c.getDepartment() != null ? nullSafe(c.getDepartment().getLabelEn()) : "";
        String jFr = c.getJobTitle() != null ? nullSafe(c.getJobTitle().getLabelFr()) : "";
        String jEn = c.getJobTitle() != null ? nullSafe(c.getJobTitle().getLabelEn()) : "";
        return new String[]{
                nullSafe(c.getEmail()), nullSafe(c.getFirstName()), nullSafe(c.getLastName()),
                nullSafe(c.getCompany()), nullSafe(c.getTitle()),
                nullSafe(c.getPhone()), nullSafe(c.getFax()), nullSafe(c.getMobile()),
                dFr, dEn, jFr, jEn
        };
    }

    private String[] sampleCardRow() {
        return new String[]{
                "jean.dupont@afrilandfirstbank.com",
                "Jean", "Dupont", "Afriland First Bank", "Ingénieur",
                "222 233 068", "222 221 785", "690 000 000",
                "Direction Financière", "Financial Department",
                "Ingénieur", "Engineer"
        };
    }

    private PrintWriter csvWriter(ByteArrayOutputStream baos) {
        baos.writeBytes(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
        return new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));
    }

    private String csvLine(String... fields) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fields.length; i++) {
            if (i > 0) sb.append(';');
            sb.append('"').append(escape(fields[i])).append('"');
        }
        return sb.toString();
    }

    private String escape(String field) {
        if (field == null) return "";
        return field.replace("\"", "\"\"");
    }

    private String nullSafe(String s) {
        return s == null ? "" : s;
    }
}
