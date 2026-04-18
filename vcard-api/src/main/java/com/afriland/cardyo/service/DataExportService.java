package com.afriland.cardyo.service;

import com.afriland.cardyo.entity.Card;
import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.repository.DepartmentRepository;
import com.afriland.cardyo.repository.JobTitleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DataExportService {

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

    public String getFilename(String scope) {
        return switch (scope) {
            case "cards"       -> "cartes.csv";
            case "departments" -> "directions.csv";
            case "job_titles"  -> "titres-postes.csv";
            default -> "export.csv";
        };
    }

    private byte[] exportCards() {
        List<Card> cards = cardRepository.findAll(Sort.by("createdAt").descending());
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = csvWriter(baos);

        w.println(csvLine("email", "first_name", "last_name", "company",
                "title", "phone", "fax", "mobile",
                "department_fr", "department_en", "job_title_fr", "job_title_en"));

        for (Card c : cards) {
            String dFr = c.getDepartment() != null ? c.getDepartment().getLabelFr() : "";
            String dEn = c.getDepartment() != null ? c.getDepartment().getLabelEn() : "";
            String jFr = c.getJobTitle() != null ? c.getJobTitle().getLabelFr() : "";
            String jEn = c.getJobTitle() != null ? c.getJobTitle().getLabelEn() : "";

            w.println(csvLine(c.getEmail(), c.getFirstName(), c.getLastName(),
                    c.getCompany(), c.getTitle(), c.getPhone(), c.getFax(),
                    c.getMobile(), dFr, dEn, jFr, jEn));
        }
        w.flush();
        return baos.toByteArray();
    }

    private byte[] exportDepartments() {
        List<Department> list = departmentRepository.findAll(
                Sort.by("createdAt").descending());
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = csvWriter(baos);
        w.println(csvLine("label_fr", "label_en"));
        for (Department d : list) {
            w.println(csvLine(d.getLabelFr(), d.getLabelEn()));
        }
        w.flush();
        return baos.toByteArray();
    }

    private byte[] exportJobTitles() {
        List<JobTitle> list = jobTitleRepository.findAll(
                Sort.by("createdAt").descending());
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = csvWriter(baos);
        w.println(csvLine("label_fr", "label_en"));
        for (JobTitle jt : list) {
            w.println(csvLine(jt.getLabelFr(), jt.getLabelEn()));
        }
        w.flush();
        return baos.toByteArray();
    }

    private PrintWriter csvWriter(ByteArrayOutputStream baos) {
        // UTF-8 BOM for Excel compatibility; ByteArrayOutputStream.write never throws.
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
}
