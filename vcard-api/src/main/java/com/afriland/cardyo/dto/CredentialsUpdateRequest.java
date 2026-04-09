package com.afriland.cardyo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CredentialsUpdateRequest {
    @NotBlank
    private String currentPassword;
    private String newEmail;
    private String newPassword;
}
