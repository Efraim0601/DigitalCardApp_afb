package com.afriland.cardyo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "admin_login")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminLogin {

    @Id
    @Column(nullable = false)
    private Integer id;

    @Column(nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void onSave() {
        this.id = 1;
        updatedAt = Instant.now();
    }
}
