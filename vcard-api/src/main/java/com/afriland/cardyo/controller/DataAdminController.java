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

    private static final MediaType XLSX_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final DataImportService importService;
    private final DataExportService exportService;

    @PostMapping("/data-import")
    public ResponseEntity<Object> importData(
            @RequestParam String scope,
            @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(importService.importData(file, scope));
    }

    @GetMapping("/data-export")
    public ResponseEntity<byte[]> exportData(
            @RequestParam String scope,
            @RequestParam(defaultValue = "csv") String format) {
        if ("xlsx".equalsIgnoreCase(format)) {
            byte[] body = exportService.exportXlsx(scope);
            return attach(body, exportService.getXlsxFilename(scope), XLSX_TYPE);
        }
        byte[] body = exportService.exportCsv(scope);
        return attach(body, exportService.getFilename(scope),
                MediaType.parseMediaType("text/csv; charset=utf-8"));
    }

    @GetMapping("/data-template")
    public ResponseEntity<byte[]> exportTemplate(@RequestParam String scope) {
        byte[] body = exportService.exportTemplateXlsx(scope);
        return attach(body, exportService.getTemplateFilename(scope), XLSX_TYPE);
    }

    private ResponseEntity<byte[]> attach(byte[] body, String filename, MediaType type) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(type)
                .body(body);
    }
}
