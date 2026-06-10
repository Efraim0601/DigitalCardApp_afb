package com.afriland.cardyo.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CardUpdateRequest {
    private String email;
    private String firstName;
    private String lastName;
    private String company;
    private String title;
    private String mobile;
    private UUID departmentId;
    private UUID jobTitleId;
}
