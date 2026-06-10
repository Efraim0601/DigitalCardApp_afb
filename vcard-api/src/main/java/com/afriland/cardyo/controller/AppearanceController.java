package com.afriland.cardyo.controller;

import com.afriland.cardyo.service.AppearanceSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public endpoint so the employee/visitor card page can read the active template settings. */
@RestController
@RequestMapping("/api/appearance-settings")
@RequiredArgsConstructor
public class AppearanceController {

    private final AppearanceSettingsService appearanceSettingsService;

    @GetMapping
    public ResponseEntity<Object> getSettings() {
        return ResponseEntity.ok(appearanceSettingsService.getSettings());
    }
}
