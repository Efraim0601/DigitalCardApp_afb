package com.afriland.cardyo.service;

import com.afriland.cardyo.dto.LabelCreateRequest;
import com.afriland.cardyo.dto.LabelDto;
import com.afriland.cardyo.dto.PagedResponse;
import com.afriland.cardyo.entity.LabelEntity;
import com.afriland.cardyo.repository.LabelEntityRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public class LabelService<T extends LabelEntity> {

    private final LabelEntityRepository<T> repository;
    private final Supplier<T> factory;
    private final String cacheKey;
    private final LabelCacheService cacheService;

    public LabelService(LabelEntityRepository<T> repository,
                        Supplier<T> factory,
                        String cacheKey,
                        LabelCacheService cacheService) {
        this.repository = repository;
        this.factory = factory;
        this.cacheKey = cacheKey;
        this.cacheService = cacheService;
    }

    public PagedResponse<LabelDto> findAll(int limit, int offset, String q) {
        limit = Math.min(Math.max(limit, 1), 200);

        if (q != null && !q.isBlank()) {
            int page = offset / limit;
            Page<T> result = repository.search(q.trim(),
                    PageRequest.of(page, limit, Sort.by("createdAt").descending()));
            return PagedResponse.<LabelDto>builder()
                    .items(result.getContent().stream().map(this::toDto).collect(Collectors.toList()))
                    .total(result.getTotalElements())
                    .limit(limit).offset(offset)
                    .build();
        }

        List<LabelDto> all = cacheService.getOrLoad(cacheKey, () ->
                repository.findAll(Sort.by("createdAt").descending())
                        .stream().map(this::toDto).collect(Collectors.toList()));

        List<LabelDto> items = all.stream().skip(offset).limit(limit).collect(Collectors.toList());
        return PagedResponse.<LabelDto>builder()
                .items(items).total(all.size())
                .limit(limit).offset(offset)
                .build();
    }

    @Transactional
    public LabelDto create(LabelCreateRequest request) {
        T entity = factory.get();
        entity.setLabelFr(request.getLabelFr());
        entity.setLabelEn(request.getLabelEn());
        T saved = repository.save(entity);
        cacheService.invalidate(cacheKey);
        return toDto(saved);
    }

    @Transactional
    public LabelDto update(UUID id, LabelCreateRequest request) {
        T entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Not found: " + id));
        if (request.getLabelFr() != null) entity.setLabelFr(request.getLabelFr());
        if (request.getLabelEn() != null) entity.setLabelEn(request.getLabelEn());
        T saved = repository.save(entity);
        cacheService.invalidate(cacheKey);
        return toDto(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Not found: " + id);
        }
        repository.deleteById(id);
        cacheService.invalidate(cacheKey);
    }

    @Transactional
    public int bulkDelete(List<UUID> ids) {
        List<T> entities = repository.findAllById(ids);
        repository.deleteAll(entities);
        cacheService.invalidate(cacheKey);
        return entities.size();
    }

    public LabelDto toDto(LabelEntity entity) {
        if (entity == null) return null;
        return LabelDto.builder()
                .id(entity.getId())
                .labelFr(entity.getLabelFr())
                .labelEn(entity.getLabelEn())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
