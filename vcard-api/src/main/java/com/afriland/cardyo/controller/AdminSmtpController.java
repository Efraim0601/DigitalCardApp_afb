package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.SmtpSettingsUpdateRequest;
import com.afriland.cardyo.dto.SmtpTestRequest;
import com.afriland.cardyo.service.SmtpSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/smtp-settings")
@RequiredArgsConstructor
public class AdminSmtpController {

    private final SmtpSettingsService smtpSettingsService;

    @GetMapping
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(smtpSettingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(
            @Valid @RequestBody SmtpSettingsUpdateRequest request) {
        return ResponseEntity.ok(smtpSettingsService.updateSettings(request));
    }

    @PostMapping("/test")
    public ResponseEntity<?> sendTestEmail(@Valid @RequestBody SmtpTestRequest request) {
        smtpSettingsService.sendTestEmail(request.getToEmail());
        return ResponseEntity.ok(Map.of("success", true));
    }
}
