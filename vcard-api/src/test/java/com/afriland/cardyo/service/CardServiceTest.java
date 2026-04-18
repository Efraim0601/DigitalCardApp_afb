package com.afriland.cardyo.service;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.CardCreateRequest;
import com.afriland.cardyo.dto.CardDto;
import com.afriland.cardyo.dto.CardUpdateRequest;
import com.afriland.cardyo.dto.PagedResponse;
import com.afriland.cardyo.entity.Card;
import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.repository.DepartmentRepository;
import com.afriland.cardyo.repository.JobTitleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
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
class CardServiceTest {

    @Mock private CardRepository cardRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private JobTitleRepository jobTitleRepository;
    @Mock private SmtpSettingsService smtpSettingsService;

    private AppProperties appProperties;

    @InjectMocks private CardService cardService;

    private Card baseCard;
    private UUID cardId;
    private UUID departmentId;
    private UUID jobTitleId;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.getCard().setFixedPhone("222 233 068");
        appProperties.getCard().setFixedFax("222 221 785");
        cardService = new CardService(cardRepository, departmentRepository,
                jobTitleRepository, appProperties, smtpSettingsService);

        cardId = UUID.randomUUID();
        departmentId = UUID.randomUUID();
        jobTitleId = UUID.randomUUID();

        Department dept = new Department();
        dept.setId(departmentId);
        dept.setLabelFr("IT");
        dept.setLabelEn("IT");
        dept.setCreatedAt(Instant.now());

        JobTitle jt = new JobTitle();
        jt.setId(jobTitleId);
        jt.setLabelFr("Ingénieur");
        jt.setLabelEn("Engineer");
        jt.setCreatedAt(Instant.now());

        baseCard = Card.builder()
                .id(cardId)
                .email("john@example.com")
                .firstName("John")
                .lastName("Doe")
                .company("Afriland")
                .title("Engineer")
                .phone("222 233 068")
                .fax("222 221 785")
                .mobile("690 000 000")
                .department(dept)
                .jobTitle(jt)
                .shareCount(0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void findByEmail_returnsDtoWhenFound() {
        when(cardRepository.findByEmailWithRelations("john@example.com"))
                .thenReturn(Optional.of(baseCard));

        CardDto dto = cardService.findByEmail("John@example.com");

        assertThat(dto.getEmail()).isEqualTo("john@example.com");
        assertThat(dto.getFirstName()).isEqualTo("John");
        assertThat(dto.getDepartment()).isNotNull();
        assertThat(dto.getJobTitle()).isNotNull();
    }

    @Test
    void findByEmail_throwsWhenMissing() {
        when(cardRepository.findByEmailWithRelations(anyString()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> cardService.findByEmail("missing@x.com"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void findAll_usesPlainListingWhenNoQuery() {
        Page<Card> page = new PageImpl<>(List.of(baseCard));
        when(cardRepository.findAllWithRelations(any(Pageable.class))).thenReturn(page);

        PagedResponse<CardDto> res = cardService.findAll(20, 0, null);

        assertThat(res.getItems()).hasSize(1);
        assertThat(res.getTotal()).isEqualTo(1);
        verify(cardRepository, never()).search(anyString(), any());
    }

    @Test
    void findAll_usesSearchWhenQueryProvided() {
        Page<Card> page = new PageImpl<>(List.of(baseCard));
        when(cardRepository.search(eq("john"), any(Pageable.class))).thenReturn(page);

        PagedResponse<CardDto> res = cardService.findAll(20, 0, "  john ");

        assertThat(res.getItems()).hasSize(1);
        verify(cardRepository, never()).findAllWithRelations(any());
    }

    @Test
    void findAll_clampsLimitBetweenOneAndTwoHundred() {
        Page<Card> empty = new PageImpl<>(List.of());
        when(cardRepository.findAllWithRelations(any(Pageable.class))).thenReturn(empty);

        PagedResponse<CardDto> low = cardService.findAll(0, 0, null);
        PagedResponse<CardDto> high = cardService.findAll(9999, 0, null);

        assertThat(low.getLimit()).isEqualTo(1);
        assertThat(high.getLimit()).isEqualTo(200);
    }

    @Test
    void upsert_createsCardAndNotifies() {
        CardCreateRequest req = new CardCreateRequest();
        req.setEmail("NEW@example.com");
        req.setFirstName("New");
        req.setLastName("User");
        req.setMobile("690 123 456");
        req.setDepartmentId(departmentId);
        req.setJobTitleId(jobTitleId);

        when(cardRepository.existsByEmailIgnoreCase("NEW@example.com")).thenReturn(false);
        when(cardRepository.findByEmailWithRelations("new@example.com"))
                .thenReturn(Optional.of(baseCard));

        CardDto dto = cardService.upsert(req);

        assertThat(dto).isNotNull();
        verify(cardRepository).upsertByEmail(eq("new@example.com"), eq("New"), eq("User"),
                any(), any(), eq("222 233 068"), eq("222 221 785"), anyString(),
                eq(departmentId), eq(jobTitleId));
        verify(smtpSettingsService).notifyCardCreatedOrUpdated(any(CardDto.class), eq(true));
    }

    @Test
    void upsert_flagsExistingCardAsUpdate() {
        CardCreateRequest req = new CardCreateRequest();
        req.setEmail("john@example.com");
        when(cardRepository.existsByEmailIgnoreCase("john@example.com")).thenReturn(true);
        when(cardRepository.findByEmailWithRelations("john@example.com"))
                .thenReturn(Optional.of(baseCard));

        cardService.upsert(req);

        verify(smtpSettingsService).notifyCardCreatedOrUpdated(any(CardDto.class), eq(false));
    }

    @Test
    void update_appliesProvidedFieldsOnly() {
        CardUpdateRequest req = new CardUpdateRequest();
        req.setFirstName("Jane");
        req.setMobile("690 999 999");

        when(cardRepository.findById(cardId)).thenReturn(Optional.of(baseCard));
        when(cardRepository.save(any(Card.class))).thenAnswer(inv -> inv.getArgument(0));

        CardDto dto = cardService.update(cardId, req);

        assertThat(dto.getFirstName()).isEqualTo("Jane");
        assertThat(baseCard.getFirstName()).isEqualTo("Jane");
        assertThat(baseCard.getLastName()).isEqualTo("Doe"); // untouched
        assertThat(baseCard.getPhone()).isEqualTo("222 233 068");
        verify(smtpSettingsService).notifyCardCreatedOrUpdated(any(CardDto.class), eq(false));
    }

    @Test
    void update_throwsWhenCardMissing() {
        when(cardRepository.findById(cardId)).thenReturn(Optional.empty());
        CardUpdateRequest request = new CardUpdateRequest();
        assertThatThrownBy(() -> cardService.update(cardId, request))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void update_throwsWhenDepartmentMissing() {
        CardUpdateRequest req = new CardUpdateRequest();
        req.setDepartmentId(departmentId);
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(baseCard));
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cardService.update(cardId, req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Department");
    }

    @Test
    void update_throwsWhenJobTitleMissing() {
        CardUpdateRequest req = new CardUpdateRequest();
        req.setJobTitleId(jobTitleId);
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(baseCard));
        when(jobTitleRepository.findById(jobTitleId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cardService.update(cardId, req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("JobTitle");
    }

    @Test
    void delete_removesCardWhenExists() {
        when(cardRepository.existsById(cardId)).thenReturn(true);
        cardService.delete(cardId);
        verify(cardRepository).deleteById(cardId);
    }

    @Test
    void delete_throwsWhenMissing() {
        when(cardRepository.existsById(cardId)).thenReturn(false);
        assertThatThrownBy(() -> cardService.delete(cardId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void incrementShareCount_throwsWhenEmailUnknown() {
        when(cardRepository.incrementShareCount("x@y.com")).thenReturn(0);
        assertThatThrownBy(() -> cardService.incrementShareCount("X@y.com"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void incrementShareCount_passesNormalizedEmail() {
        when(cardRepository.incrementShareCount("john@example.com")).thenReturn(1);
        cardService.incrementShareCount(" JOHN@example.com ");
        verify(cardRepository).incrementShareCount("john@example.com");
    }

    @Test
    void toDto_handlesNullRelations() {
        Card card = Card.builder()
                .id(cardId)
                .email("solo@example.com")
                .build();
        CardDto dto = cardService.toDto(card);
        assertThat(dto.getDepartment()).isNull();
        assertThat(dto.getJobTitle()).isNull();
        assertThat(dto.getEmail()).isEqualTo("solo@example.com");
    }
}
