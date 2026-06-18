package com.afriland.cardyo.service;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.CardCreateRequest;
import com.afriland.cardyo.dto.CardDto;
import com.afriland.cardyo.dto.CardUpdateRequest;
import com.afriland.cardyo.dto.LabelDto;
import com.afriland.cardyo.dto.PagedResponse;
import com.afriland.cardyo.entity.Card;
import com.afriland.cardyo.entity.CardStatus;
import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.repository.DepartmentRepository;
import com.afriland.cardyo.repository.JobTitleRepository;
import com.afriland.cardyo.util.PhoneFormatter;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;
    private final AppProperties appProperties;
    private final SmtpSettingsService smtpSettingsService;

    public CardDto findByEmail(String email) {
        Card card = cardRepository.findByEmailWithRelations(email.toLowerCase().trim())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Card not found for email: " + email));
        return toDto(card);
    }

    public PagedResponse<CardDto> findAll(int limit, int offset, String q, CardStatus status) {
        limit = Math.min(Math.max(limit, 1), 200);
        int page = offset / limit;
        PageRequest pageable = PageRequest.of(page, limit,
                Sort.by("createdAt").descending());

        boolean hasQuery = q != null && !q.isBlank();
        Page<Card> result;
        if (status != null) {
            result = hasQuery
                    ? cardRepository.searchByStatus(q.trim(), status, pageable)
                    : cardRepository.findAllByStatusWithRelations(status, pageable);
        } else if (hasQuery) {
            result = cardRepository.search(q.trim(), pageable);
        } else {
            result = cardRepository.findAllWithRelations(pageable);
        }

        return PagedResponse.<CardDto>builder()
                .items(result.getContent().stream().map(this::toDto).toList())
                .total(result.getTotalElements())
                .limit(limit).offset(offset)
                .build();
    }

    @Transactional
    public CardDto upsert(CardCreateRequest request) {
        boolean alreadyExists = cardRepository.existsByEmailIgnoreCase(request.getEmail());
        String mobile = PhoneFormatter.format(request.getMobile());

        cardRepository.upsertByEmail(
                request.getEmail().toLowerCase().trim(),
                request.getFirstName(),
                request.getLastName(),
                request.getCompany(),
                request.getTitle(),
                appProperties.getCard().getFixedPhone(),
                appProperties.getCard().getFixedFax(),
                mobile,
                request.getDepartmentId(),
                request.getJobTitleId());

        CardDto savedCard = findByEmail(request.getEmail());
        smtpSettingsService.notifyCardCreatedOrUpdated(savedCard, !alreadyExists);
        return savedCard;
    }

    /**
     * Card submitted from the public client portal. It is created as
     * {@link CardStatus#PENDING} and requires admin validation before it can be
     * shared or use any application feature. Refuses to overwrite an existing card.
     */
    @Transactional
    public CardDto createPublicRequest(CardCreateRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        requireAllowedDomain(email);
        if (cardRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("A card already exists for this email: " + email);
        }

        Card card = Card.builder()
                .email(email)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .company(request.getCompany())
                .title(request.getTitle())
                .phone(appProperties.getCard().getFixedPhone())
                .fax(appProperties.getCard().getFixedFax())
                .mobile(PhoneFormatter.format(request.getMobile()))
                .shareCount(0)
                .status(CardStatus.PENDING)
                .build();

        if (request.getDepartmentId() != null) {
            card.setDepartment(departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Department not found: " + request.getDepartmentId())));
        }
        if (request.getJobTitleId() != null) {
            card.setJobTitle(jobTitleRepository.findById(request.getJobTitleId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "JobTitle not found: " + request.getJobTitleId())));
        }

        return toDto(cardRepository.save(card));
    }

    /**
     * Rejects a portal submission whose email does not belong to the configured
     * corporate domain. No-op when no domain is configured.
     */
    private void requireAllowedDomain(String email) {
        String domain = appProperties.getPortal().getAllowedEmailDomain();
        if (domain == null || domain.isBlank()) {
            return;
        }
        String suffix = "@" + domain.toLowerCase().trim();
        if (!email.endsWith(suffix)) {
            throw new IllegalArgumentException(
                    "Only " + suffix + " email addresses may create a card: " + email);
        }
    }

    /** Number of cards awaiting admin validation (used for the admin badge). */
    public long countPending() {
        return cardRepository.countByStatus(CardStatus.PENDING);
    }

    /** Admin approves a pending card; the holder is notified by email. */
    @Transactional
    public CardDto validate(UUID id) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));
        card.setStatus(CardStatus.APPROVED);
        card.setValidatedAt(Instant.now());
        CardDto dto = toDto(cardRepository.save(card));
        smtpSettingsService.notifyCardValidated(dto);
        return dto;
    }

    /** Admin rejects a card; the holder is notified by email. */
    @Transactional
    public CardDto reject(UUID id) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));
        card.setStatus(CardStatus.REJECTED);
        card.setValidatedAt(null);
        CardDto dto = toDto(cardRepository.save(card));
        smtpSettingsService.notifyCardRejected(dto);
        return dto;
    }

    @Transactional
    public CardDto update(UUID id, CardUpdateRequest request) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));

        if (request.getEmail() != null)     card.setEmail(request.getEmail().toLowerCase().trim());
        if (request.getFirstName() != null) card.setFirstName(request.getFirstName());
        if (request.getLastName() != null)  card.setLastName(request.getLastName());
        if (request.getCompany() != null)   card.setCompany(request.getCompany());
        if (request.getTitle() != null)     card.setTitle(request.getTitle());
        if (request.getMobile() != null)    card.setMobile(PhoneFormatter.format(request.getMobile()));

        card.setPhone(appProperties.getCard().getFixedPhone());
        card.setFax(appProperties.getCard().getFixedFax());

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Department not found: " + request.getDepartmentId()));
            card.setDepartment(dept);
        }
        if (request.getJobTitleId() != null) {
            JobTitle jt = jobTitleRepository.findById(request.getJobTitleId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "JobTitle not found: " + request.getJobTitleId()));
            card.setJobTitle(jt);
        }

        Card saved = cardRepository.save(card);
        CardDto dto = toDto(saved);
        smtpSettingsService.notifyCardCreatedOrUpdated(dto, false);
        return dto;
    }

    @Transactional
    public void delete(UUID id) {
        if (!cardRepository.existsById(id)) {
            throw new EntityNotFoundException("Card not found: " + id);
        }
        cardRepository.deleteById(id);
    }

    @Transactional
    public int bulkDelete(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        return cardRepository.bulkDeleteByIds(ids);
    }

    @Transactional
    public void incrementShareCount(String email) {
        String normalized = email.toLowerCase().trim();
        Card card = cardRepository.findByEmailIgnoreCase(normalized)
                .orElseThrow(() -> new EntityNotFoundException("Card not found for email: " + email));
        if (card.getStatus() != CardStatus.APPROVED) {
            throw new IllegalStateException("Card is not validated yet: " + email);
        }
        cardRepository.incrementShareCount(normalized);
    }

    public CardDto toDto(Card card) {
        LabelDto deptDto = null;
        if (card.getDepartment() != null) {
            Department d = card.getDepartment();
            deptDto = LabelDto.builder()
                    .id(d.getId()).labelFr(d.getLabelFr())
                    .labelEn(d.getLabelEn()).createdAt(d.getCreatedAt())
                    .build();
        }
        LabelDto jtDto = null;
        if (card.getJobTitle() != null) {
            JobTitle j = card.getJobTitle();
            jtDto = LabelDto.builder()
                    .id(j.getId()).labelFr(j.getLabelFr())
                    .labelEn(j.getLabelEn()).createdAt(j.getCreatedAt())
                    .build();
        }
        return CardDto.builder()
                .id(card.getId())
                .email(card.getEmail())
                .firstName(card.getFirstName())
                .lastName(card.getLastName())
                .company(card.getCompany())
                .title(card.getTitle())
                .phone(card.getPhone())
                .fax(card.getFax())
                .mobile(card.getMobile())
                .department(deptDto)
                .jobTitle(jtDto)
                .shareCount(card.getShareCount())
                .templateId(card.getTemplateId())
                .status(card.getStatus() != null ? card.getStatus().name() : CardStatus.APPROVED.name())
                .validatedAt(card.getValidatedAt())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .build();
    }

    @Transactional
    public CardDto updateTemplate(String email, String templateId) {
        Card card = cardRepository.findByEmailWithRelations(email.toLowerCase().trim())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Card not found for email: " + email));
        if (card.getStatus() != CardStatus.APPROVED) {
            throw new IllegalStateException("Card is not validated yet: " + email);
        }
        card.setTemplateId(templateId);
        return toDto(cardRepository.save(card));
    }
}
