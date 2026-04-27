package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.AppearanceSettingsUpdateRequest;
import com.afriland.cardyo.service.AppearanceSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/appearance-settings")
@RequiredArgsConstructor
public class AdminAppearanceController {

    private final AppearanceSettingsService appearanceSettingsService;

    @GetMapping
    public ResponseEntity<Object> getSettings() {
        return ResponseEntity.ok(appearanceSettingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<Object> updateSettings(
            @Valid @RequestBody AppearanceSettingsUpdateRequest request) {
        return ResponseEntity.ok(appearanceSettingsService.updateSettings(request));
    }
}
