package com.afriland.cardyo.service;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.ImportResultDto;
import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.repository.DepartmentRepository;
import com.afriland.cardyo.repository.JobTitleRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataImportServiceTest {

    @Mock private DepartmentRepository departmentRepository;
    @Mock private JobTitleRepository jobTitleRepository;
    @Mock private CardRepository cardRepository;

    private AppProperties appProperties;
    private DataImportService service;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.getCard().setFixedPhone("222 233 068");
        appProperties.getCard().setFixedFax("222 221 785");
        service = new DataImportService(departmentRepository, jobTitleRepository,
                cardRepository, appProperties);
    }

    @Test
    void importData_rejectsUnknownScope() {
        MockMultipartFile file = new MockMultipartFile("file", "x.csv", "text/csv", "label_fr\nIT".getBytes());
        assertThatThrownBy(() -> service.importData(file, "unknown"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void importDepartments_fromCsv_upsertsNewEntities() throws Exception {
        String csv = "label_fr;label_en\nIT;IT\nRH;HR\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "departments.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        when(departmentRepository.findByLabelFrIgnoreCase(anyString()))
                .thenReturn(Optional.empty());
        when(departmentRepository.findByLabelEnIgnoreCase(anyString()))
                .thenReturn(Optional.empty());
        when(departmentRepository.save(any(Department.class))).thenAnswer(inv -> inv.getArgument(0));

        ImportResultDto result = service.importData(file, "departments");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getImported().getDepartments()).isEqualTo(2);
        verify(departmentRepository, never()).findByLabelFrIgnoreCase(""); // no blanks
    }

    @Test
    void importDepartments_reusesExistingMatchByLabelFr() throws Exception {
        String csv = "label_fr;label_en\nExisting;Existing\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "d.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Department existing = new Department();
        existing.setId(UUID.randomUUID());
        when(departmentRepository.findByLabelFrIgnoreCase("Existing"))
                .thenReturn(Optional.of(existing));
        when(departmentRepository.save(any(Department.class))).thenReturn(existing);

        service.importData(file, "departments");
        verify(departmentRepository, never()).findByLabelEnIgnoreCase(anyString());
    }

    @Test
    void importDepartments_skipsBlankLabels() throws Exception {
        String csv = "label_fr;label_en\n;IT\nIT;IT\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "d.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        when(departmentRepository.findByLabelFrIgnoreCase(anyString()))
                .thenReturn(Optional.empty());
        when(departmentRepository.findByLabelEnIgnoreCase(anyString()))
                .thenReturn(Optional.empty());
        when(departmentRepository.save(any(Department.class))).thenAnswer(inv -> inv.getArgument(0));

        ImportResultDto result = service.importData(file, "departments");
        assertThat(result.getImported().getDepartments()).isEqualTo(1);
        assertThat(result.getWarnings()).anyMatch(w -> w.contains("missing label_fr"));
    }

    @Test
    void importDepartments_fallsBackEnToFrWhenMissing() throws Exception {
        String csv = "label_fr\nSolo\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "d.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        when(departmentRepository.findByLabelFrIgnoreCase("Solo"))
                .thenReturn(Optional.empty());
        when(departmentRepository.findByLabelEnIgnoreCase("Solo"))
                .thenReturn(Optional.empty());
        when(departmentRepository.save(any(Department.class))).thenAnswer(inv -> {
            Department d = inv.getArgument(0);
            assertThat(d.getLabelFr()).isEqualTo("Solo");
            assertThat(d.getLabelEn()).isEqualTo("Solo");
            return d;
        });

        service.importData(file, "departments");
    }

    @Test
    void importJobTitles_countsRows() throws Exception {
        String csv = "label_fr,label_en\nIngenieur,Engineer\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "j.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        when(jobTitleRepository.findByLabelFrIgnoreCase(anyString()))
                .thenReturn(Optional.empty());
        when(jobTitleRepository.findByLabelEnIgnoreCase(anyString()))
                .thenReturn(Optional.empty());
        when(jobTitleRepository.save(any(JobTitle.class))).thenAnswer(inv -> inv.getArgument(0));

        ImportResultDto r = service.importData(file, "job_titles");
        assertThat(r.getImported().getJobTitles()).isEqualTo(1);
    }

    @Test
    void importCards_upsertsWithResolvedIdsAndWarnsAboutCreated() throws Exception {
        String csv = "email;first_name;last_name;department;job_title;mobile\n"
                + "a@b.com;Alice;Dupont;Risques;Ingenieur;690 111 222\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "cards.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        when(departmentRepository.findByLabelFrIgnoreCase("Risques")).thenReturn(Optional.empty());
        when(departmentRepository.findByLabelEnIgnoreCase("Risques")).thenReturn(Optional.empty());
        Department createdDept = new Department();
        createdDept.setId(UUID.randomUUID());
        createdDept.setLabelFr("Risques");
        when(departmentRepository.save(any(Department.class))).thenReturn(createdDept);

        when(jobTitleRepository.findByLabelFrIgnoreCase("Ingenieur")).thenReturn(Optional.empty());
        when(jobTitleRepository.findByLabelEnIgnoreCase("Ingenieur")).thenReturn(Optional.empty());
        JobTitle createdJt = new JobTitle();
        createdJt.setId(UUID.randomUUID());
        createdJt.setLabelFr("Ingenieur");
        when(jobTitleRepository.save(any(JobTitle.class))).thenReturn(createdJt);

        ImportResultDto r = service.importData(file, "cards");
        assertThat(r.getImported().getCards()).isEqualTo(1);
        assertThat(r.getWarnings()).anyMatch(w -> w.contains("department 'Risques'"));
        assertThat(r.getWarnings()).anyMatch(w -> w.contains("job title 'Ingenieur'"));
        verify(cardRepository).upsertByEmail(eq("a@b.com"), eq("Alice"), eq("Dupont"),
                any(), any(), eq("222 233 068"), eq("222 221 785"),
                anyString(), any(UUID.class), any(UUID.class));
    }

    @Test
    void importCards_skipsRowsWithMissingEmail() throws Exception {
        String csv = "email;first_name\n;Alice\na@b.com;Bob\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "cards.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        ImportResultDto r = service.importData(file, "cards");
        assertThat(r.getImported().getCards()).isEqualTo(1);
        assertThat(r.getWarnings()).anyMatch(w -> w.contains("missing email"));
    }

    @Test
    void importCards_strippedBomAndAcceptsAlternativeHeaderNames() throws Exception {
        String csv = """
                \uFEFFemail,firstname,lastname
                a@b.com,Alice,Dupont
                """;
        MockMultipartFile file = new MockMultipartFile(
                "file", "cards.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        ImportResultDto r = service.importData(file, "cards");
        assertThat(r.getImported().getCards()).isEqualTo(1);
    }

    @Test
    void importData_rejectsCardsExceedingLimit() {
        StringBuilder csv = new StringBuilder("email\n");
        for (int i = 0; i < 20001; i++) csv.append("a").append(i).append("@x.com\n");
        MockMultipartFile file = new MockMultipartFile(
                "file", "cards.csv", "text/csv", csv.toString().getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.importData(file, "cards"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("20 000");
    }

    @Test
    void importData_rejectsLabelsExceedingLimit() {
        StringBuilder csv = new StringBuilder("label_fr\n");
        for (int i = 0; i < 5001; i++) csv.append("L").append(i).append("\n");
        MockMultipartFile file = new MockMultipartFile(
                "file", "d.csv", "text/csv", csv.toString().getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.importData(file, "departments"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5 000");
    }

    @Test
    void importData_fromXlsxParsesCells() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet s = wb.createSheet();
            Row header = s.createRow(0);
            header.createCell(0).setCellValue("label_fr");
            header.createCell(1).setCellValue("label_en");
            Row r1 = s.createRow(1);
            r1.createCell(0).setCellValue("IT");
            r1.createCell(1).setCellValue("IT");
            // numeric cell
            Row r2 = s.createRow(2);
            r2.createCell(0).setCellValue("N1");
            Cell c = r2.createCell(1);
            c.setCellValue(42.0);
            // boolean cell
            Row r3 = s.createRow(3);
            r3.createCell(0).setCellValue("B1");
            r3.createCell(1).setCellValue(true);
            wb.write(out);
        }
        MockMultipartFile file = new MockMultipartFile(
                "file", "d.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                out.toByteArray());

        when(departmentRepository.findByLabelFrIgnoreCase(anyString()))
                .thenReturn(Optional.empty());
        when(departmentRepository.findByLabelEnIgnoreCase(anyString()))
                .thenReturn(Optional.empty());
        when(departmentRepository.save(any(Department.class))).thenAnswer(inv -> inv.getArgument(0));

        ImportResultDto r = service.importData(file, "departments");
        assertThat(r.getImported().getDepartments()).isEqualTo(3);
    }
}
