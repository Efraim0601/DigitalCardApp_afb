package com.afriland.cardyo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AppearanceSettingsDto {
    private boolean allowUserTemplate;
    private String defaultTemplate;
    private Instant updatedAt;
}
