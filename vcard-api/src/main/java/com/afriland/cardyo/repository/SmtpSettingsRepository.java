package com.afriland.cardyo.repository;

import com.afriland.cardyo.entity.SmtpSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SmtpSettingsRepository extends JpaRepository<SmtpSettings, Integer> {
}
