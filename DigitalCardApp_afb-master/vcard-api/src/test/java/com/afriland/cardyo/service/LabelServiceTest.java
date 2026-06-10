package com.afriland.cardyo.service;

import com.afriland.cardyo.dto.LabelCreateRequest;
import com.afriland.cardyo.dto.LabelDto;
import com.afriland.cardyo.dto.PagedResponse;
import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.repository.LabelEntityRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LabelServiceTest {

    @Mock private LabelEntityRepository<Department> repository;

    private LabelCacheService cacheService;
    private LabelService<Department> service;

    @BeforeEach
    void setUp() {
        cacheService = new LabelCacheService();
        service = new LabelService<>(repository, Department::new, "departments", cacheService);
    }

    private Department department(String fr, String en) {
        Department d = new Department();
        d.setId(UUID.randomUUID());
        d.setLabelFr(fr);
        d.setLabelEn(en);
        d.setCreatedAt(Instant.now());
        return d;
    }

    @Test
    void findAll_withQueryUsesRepositorySearch() {
        Page<Department> page = new PageImpl<>(List.of(department("RH", "HR")));
        when(repository.search(eq("rh"), any(Pageable.class))).thenReturn(page);

        PagedResponse<LabelDto> res = service.findAll(10, 0, "  rh ");

        assertThat(res.getItems()).hasSize(1);
        assertThat(res.getTotal()).isEqualTo(1);
        verify(repository, never()).findAll(any(Sort.class));
    }

    @Test
    void findAll_withoutQueryUsesCachedList() {
        when(repository.findAll(any(Sort.class)))
                .thenReturn(List.of(department("IT", "IT"), department("RH", "HR")));

        PagedResponse<LabelDto> first = service.findAll(1, 0, null);
        PagedResponse<LabelDto> second = service.findAll(10, 1, null);

        assertThat(first.getItems()).hasSize(1);
        assertThat(first.getTotal()).isEqualTo(2);
        assertThat(second.getItems()).hasSize(1);
        verify(repository).findAll(any(Sort.class)); // only loaded once thanks to cache
    }

    @Test
    void findAll_clampsLimit() {
        when(repository.findAll(any(Sort.class))).thenReturn(List.of());
        PagedResponse<LabelDto> res = service.findAll(0, 0, null);
        assertThat(res.getLimit()).isEqualTo(1);
    }

    @Test
    void create_persistsAndInvalidatesCache() {
        LabelCreateRequest req = new LabelCreateRequest();
        req.setLabelFr("IT");
        req.setLabelEn("IT");
        Department saved = department("IT", "IT");
        when(repository.save(any(Department.class))).thenReturn(saved);

        LabelDto dto = service.create(req);

        assertThat(dto.getLabelFr()).isEqualTo("IT");
        verify(repository).save(any(Department.class));
    }

    @Test
    void update_appliesPartialPatchWhenFieldsProvided() {
        Department existing = department("Old", "Old");
        UUID id = existing.getId();
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        LabelCreateRequest req = new LabelCreateRequest();
        req.setLabelFr("Nouveau");

        LabelDto dto = service.update(id, req);

        assertThat(dto.getLabelFr()).isEqualTo("Nouveau");
        assertThat(existing.getLabelEn()).isEqualTo("Old");
    }

    @Test
    void update_throwsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());
        LabelCreateRequest request = new LabelCreateRequest();
        assertThatThrownBy(() -> service.update(id, request))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_throwsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(repository.existsById(id)).thenReturn(false);
        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_removesWhenPresent() {
        UUID id = UUID.randomUUID();
        when(repository.existsById(id)).thenReturn(true);
        service.delete(id);
        verify(repository).deleteById(id);
    }

    @Test
    void bulkDelete_returnsNumberDeleted() {
        Department a = department("A", "A");
        Department b = department("B", "B");
        List<UUID> ids = List.of(a.getId(), b.getId());
        when(repository.findAllById(ids)).thenReturn(List.of(a, b));

        int deleted = service.bulkDelete(ids);

        assertThat(deleted).isEqualTo(2);
        verify(repository).deleteAll(List.of(a, b));
    }

    @Test
    void toDto_returnsNullForNullEntity() {
        assertThat(service.toDto(null)).isNull();
    }
}
