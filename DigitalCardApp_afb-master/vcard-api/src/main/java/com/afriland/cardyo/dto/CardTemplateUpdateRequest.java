package com.afriland.cardyo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CardTemplateUpdateRequest {

    @NotBlank
    private String email;

    @NotBlank
    private String templateId;
}
