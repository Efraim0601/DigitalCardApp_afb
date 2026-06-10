package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.BulkDeleteRequest;
import com.afriland.cardyo.dto.LabelCreateRequest;
import com.afriland.cardyo.entity.LabelEntity;
import com.afriland.cardyo.service.LabelService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;
import java.util.UUID;

/**
 * Shared CRUD endpoints for the two label resources (departments, job titles).
 * Concrete controllers only bind the class to a URL prefix and inject the right
 * {@link LabelService} bean.
 */
abstract class AbstractLabelController<T extends LabelEntity> {

    private final LabelService<T> labelService;

    protected AbstractLabelController(LabelService<T> labelService) {
        this.labelService = labelService;
    }

    @GetMapping
    public ResponseEntity<Object> findAll(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(labelService.findAll(limit, offset, q));
    }

    @PostMapping
    public ResponseEntity<Object> create(@Valid @RequestBody LabelCreateRequest request) {
        return ResponseEntity.ok(labelService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable UUID id,
                                         @RequestBody LabelCreateRequest request) {
        return ResponseEntity.ok(labelService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable UUID id) {
        labelService.delete(id);
        return ResponseEntity.ok(Map.of(ApiKeys.SUCCESS, true));
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Object> bulkDelete(@Valid @RequestBody BulkDeleteRequest request) {
        int deleted = labelService.bulkDelete(request.getIds());
        return ResponseEntity.ok(Map.of(ApiKeys.SUCCESS, true, ApiKeys.DELETED, deleted));
    }
}
