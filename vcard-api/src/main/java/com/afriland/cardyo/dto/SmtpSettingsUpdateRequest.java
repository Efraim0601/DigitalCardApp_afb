package com.afriland.cardyo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class SmtpSettingsUpdateRequest {
    private Boolean enabled;
    private String host;

    @Min(1)
    @Max(65535)
    private Integer port;

    private String username;
    private String password;
    private Boolean clearPassword;
    private String protocol;
    private Boolean auth;
    private Boolean starttlsEnabled;
    private Boolean sslEnabled;
    private String fromEmail;
    private String fromName;
}
