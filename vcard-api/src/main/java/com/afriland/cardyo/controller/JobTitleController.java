package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.BulkDeleteRequest;
import com.afriland.cardyo.dto.LabelCreateRequest;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.service.LabelService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/job-titles")
public class JobTitleController {

    private final LabelService<JobTitle> labelService;

    public JobTitleController(
            @Qualifier("jobTitleLabelService") LabelService<JobTitle> labelService) {
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
    public ResponseEntity<Object> create(
            @Valid @RequestBody LabelCreateRequest request) {
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
    public ResponseEntity<Object> bulkDelete(
            @Valid @RequestBody BulkDeleteRequest request) {
        int deleted = labelService.bulkDelete(request.getIds());
        return ResponseEntity.ok(Map.of(ApiKeys.SUCCESS, true, ApiKeys.DELETED, deleted));
    }
}
