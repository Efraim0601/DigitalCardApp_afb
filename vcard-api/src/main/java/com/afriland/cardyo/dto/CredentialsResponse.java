package com.afriland.cardyo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CredentialsResponse {
    private String email;
    private boolean storedInDatabase;
}
