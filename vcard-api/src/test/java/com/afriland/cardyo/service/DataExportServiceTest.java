package com.afriland.cardyo.service;

import com.afriland.cardyo.entity.Card;
import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.repository.DepartmentRepository;
import com.afriland.cardyo.repository.JobTitleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataExportServiceTest {

    @Mock private CardRepository cardRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private JobTitleRepository jobTitleRepository;

    @InjectMocks private DataExportService service;

    @Test
    void getFilename_mapsKnownScopes() {
        assertThat(service.getFilename("cards")).isEqualTo("cartes.csv");
        assertThat(service.getFilename("departments")).isEqualTo("directions.csv");
        assertThat(service.getFilename("job_titles")).isEqualTo("titres-postes.csv");
        assertThat(service.getFilename("anything-else")).isEqualTo("export.csv");
    }

    @Test
    void exportCsv_rejectsUnknownScope() {
        assertThatThrownBy(() -> service.exportCsv("unknown"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void exportCsv_cardsProducesUtf8BomHeaderAndRows() {
        Department dept = new Department();
        dept.setLabelFr("IT");
        dept.setLabelEn("IT");
        JobTitle jt = new JobTitle();
        jt.setLabelFr("Ingénieur \"étude\"");
        jt.setLabelEn("Study engineer");

        Card c = Card.builder()
                .id(UUID.randomUUID())
                .email("x@y.com")
                .firstName("Alice")
                .lastName("Dupont")
                .company("Afriland")
                .title("Engineer")
                .phone("222 233 068")
                .fax("222 221 785")
                .mobile("690 000 000")
                .department(dept)
                .jobTitle(jt)
                .createdAt(Instant.now())
                .build();

        when(cardRepository.findAll(any(Sort.class))).thenReturn(List.of(c));

        byte[] csv = service.exportCsv("cards");
        assertThat(new byte[]{csv[0], csv[1], csv[2]})
                .containsExactly((byte) 0xEF, (byte) 0xBB, (byte) 0xBF);

        String body = new String(csv, StandardCharsets.UTF_8);
        assertThat(body)
                .contains("\"email\";\"first_name\"")
                .contains("\"x@y.com\";\"Alice\"")
                .contains("\"Ingénieur \"\"étude\"\"\"");
    }

    @Test
    void exportCsv_departmentsHandlesEmptyList() {
        when(departmentRepository.findAll(any(Sort.class))).thenReturn(List.of());
        String body = new String(service.exportCsv("departments"), StandardCharsets.UTF_8);
        assertThat(body).contains("\"label_fr\";\"label_en\"");
    }

    @Test
    void exportCsv_jobTitlesHandlesNullValues() {
        JobTitle j = new JobTitle();
        j.setLabelFr(null);
        j.setLabelEn("Engineer");
        when(jobTitleRepository.findAll(any(Sort.class))).thenReturn(List.of(j));

        String body = new String(service.exportCsv("job_titles"), StandardCharsets.UTF_8);
        assertThat(body).contains("\"\";\"Engineer\"");
    }

    @Test
    void exportCsv_cardsHandlesNullRelations() {
        Card c = Card.builder()
                .id(UUID.randomUUID())
                .email("solo@x.com")
                .build();
        when(cardRepository.findAll(any(Sort.class))).thenReturn(List.of(c));

        String body = new String(service.exportCsv("cards"), StandardCharsets.UTF_8);
        assertThat(body).contains("\"solo@x.com\"");
    }
}
