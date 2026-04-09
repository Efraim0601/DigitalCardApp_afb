package com.afriland.cardyo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CardCreateRequest {
    @NotBlank @Email
    private String email;
    private String firstName;
    private String lastName;
    private String company;
    private String title;
    private String mobile;
    private UUID departmentId;
    private UUID jobTitleId;
}
