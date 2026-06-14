package com.afriland.cardyo.dto;

import lombok.Data;

@Data
public class AppearanceSettingsUpdateRequest {
    private Boolean allowUserTemplate;
    private String defaultTemplate;
}
