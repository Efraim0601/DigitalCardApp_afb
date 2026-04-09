package com.afriland.cardyo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LoginHintResponse {
    private boolean isAdminEmail;
    private boolean hasCard;
}
