package com.afriland.cardyo.controller;

import com.afriland.cardyo.service.DataExportService;
import com.afriland.cardyo.service.DataImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class DataAdminController {

    private final DataImportService importService;
    private final DataExportService exportService;

    @PostMapping("/data-import")
    public ResponseEntity<?> importData(
            @RequestParam String scope,
            @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(importService.importData(file, scope));
    }

    @GetMapping("/data-export")
    public ResponseEntity<byte[]> exportData(@RequestParam String scope) {
        byte[] csv = exportService.exportCsv(scope);
        String filename = exportService.getFilename(scope);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .body(csv);
    }
}
