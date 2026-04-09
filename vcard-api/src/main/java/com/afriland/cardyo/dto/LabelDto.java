package com.afriland.cardyo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LabelDto {
    private UUID id;
    private String labelFr;
    private String labelEn;
    private Instant createdAt;
}
