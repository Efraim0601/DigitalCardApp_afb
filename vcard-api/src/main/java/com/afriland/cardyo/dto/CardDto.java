package com.afriland.cardyo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CardDto {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String company;
    private String title;
    private String phone;
    private String fax;
    private String mobile;
    private LabelDto department;
    private LabelDto jobTitle;
    private Instant createdAt;
    private Instant updatedAt;
}
