package com.afriland.cardyo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "smtp_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SmtpSettings {

    @Id
    private Integer id;

    @Column(nullable = false)
    private boolean enabled;

    private String host;

    @Column(nullable = false)
    private Integer port;

    private String username;

    private String password;

    @Column(nullable = false)
    private String protocol;

    @Column(nullable = false)
    private boolean auth;

    @Column(name = "starttls_enabled", nullable = false)
    private boolean starttlsEnabled;

    @Column(name = "ssl_enabled", nullable = false)
    private boolean sslEnabled;

    @Column(name = "from_email")
    private String fromEmail;

    @Column(name = "from_name")
    private String fromName;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void onSave() {
        updatedAt = Instant.now();
    }
}
