package com.afriland.cardyo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LabelCreateRequest {
    @NotBlank
    private String labelFr;
    @NotBlank
    private String labelEn;
}
