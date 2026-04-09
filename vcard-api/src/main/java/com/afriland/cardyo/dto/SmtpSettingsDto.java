package com.afriland.cardyo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class SmtpSettingsDto {
    private boolean enabled;
    private String host;
    private Integer port;
    private String username;
    private boolean hasPassword;
    private String protocol;
    private boolean auth;
    private boolean starttlsEnabled;
    private boolean sslEnabled;
    private String fromEmail;
    private String fromName;
    private Instant updatedAt;
}
