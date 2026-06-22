package com.afriland.cardyo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SmtpTestRequest {
    @NotBlank
    @Email
    private String toEmail;
}
