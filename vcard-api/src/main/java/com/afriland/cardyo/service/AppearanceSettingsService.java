package com.afriland.cardyo.service;

import com.afriland.cardyo.dto.AppearanceSettingsDto;
import com.afriland.cardyo.dto.AppearanceSettingsUpdateRequest;
import com.afriland.cardyo.entity.AppearanceSettings;
import com.afriland.cardyo.repository.AppearanceSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AppearanceSettingsService {

    public static final String TEMPLATE_CLASSIC = "classic";
    public static final String TEMPLATE_MODERN = "modern";
    public static final Set<String> SUPPORTED_TEMPLATES = Set.of(TEMPLATE_CLASSIC, TEMPLATE_MODERN);

    private static final int SETTINGS_ID = 1;

    private final AppearanceSettingsRepository repository;

    @Transactional(readOnly = true)
    public AppearanceSettingsDto getSettings() {
        return toDto(getOrDefault());
    }

    @Transactional
    public AppearanceSettingsDto updateSettings(AppearanceSettingsUpdateRequest request) {
        AppearanceSettings settings = repository.findById(SETTINGS_ID).orElseGet(this::createDefault);

        if (request.getAllowUserTemplate() != null) {
            settings.setAllowUserTemplate(request.getAllowUserTemplate());
        }
        if (request.getDefaultTemplate() != null) {
            String tpl = request.getDefaultTemplate().trim().toLowerCase();
            if (!SUPPORTED_TEMPLATES.contains(tpl)) {
                throw new IllegalArgumentException("Unsupported template: " + request.getDefaultTemplate());
            }
            settings.setDefaultTemplate(tpl);
        }

        return toDto(repository.save(settings));
    }

    public boolean isTemplateSupported(String templateId) {
        if (templateId == null) return false;
        return SUPPORTED_TEMPLATES.contains(templateId.trim().toLowerCase());
    }

    public boolean isUserTemplateAllowed() {
        return getOrDefault().isAllowUserTemplate();
    }

    private AppearanceSettings getOrDefault() {
        return repository.findById(SETTINGS_ID).orElseGet(this::createDefault);
    }

    private AppearanceSettings createDefault() {
        return AppearanceSettings.builder()
                .id(SETTINGS_ID)
                .allowUserTemplate(false)
                .defaultTemplate(TEMPLATE_CLASSIC)
                .build();
    }

    private AppearanceSettingsDto toDto(AppearanceSettings settings) {
        return AppearanceSettingsDto.builder()
                .allowUserTemplate(settings.isAllowUserTemplate())
                .defaultTemplate(settings.getDefaultTemplate())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
}
