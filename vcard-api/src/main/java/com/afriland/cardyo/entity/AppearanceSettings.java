package com.afriland.cardyo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "appearance_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppearanceSettings {

    @Id
    private Integer id;

    @Column(name = "allow_user_template", nullable = false)
    private boolean allowUserTemplate;

    @Column(name = "default_template", nullable = false)
    private String defaultTemplate;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void onSave() {
        updatedAt = Instant.now();
    }
}
