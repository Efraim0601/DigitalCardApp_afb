package com.afriland.cardyo.service;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.CardDto;
import com.afriland.cardyo.dto.SmtpSettingsDto;
import com.afriland.cardyo.dto.SmtpSettingsUpdateRequest;
import com.afriland.cardyo.entity.SmtpSettings;
import com.afriland.cardyo.repository.SmtpSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Properties;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmtpSettingsService {

    private static final int SETTINGS_ID = 1;

    private final SmtpSettingsRepository smtpSettingsRepository;

    @Transactional(readOnly = true)
    public SmtpSettingsDto getSettings() {
        return toDto(getOrDefault());
    }

    @Transactional
    public SmtpSettingsDto updateSettings(SmtpSettingsUpdateRequest request) {
        SmtpSettings settings = smtpSettingsRepository.findById(SETTINGS_ID)
                .orElseGet(this::createDefault);

        if (request.getEnabled() != null) settings.setEnabled(request.getEnabled());
        if (request.getHost() != null) settings.setHost(trimToNull(request.getHost()));
        if (request.getPort() != null) settings.setPort(request.getPort());
        if (request.getUsername() != null) settings.setUsername(trimToNull(request.getUsername()));
        if (request.getProtocol() != null) settings.setProtocol(trimToNull(request.getProtocol()));
        if (request.getAuth() != null) settings.setAuth(request.getAuth());
        if (request.getStarttlsEnabled() != null) settings.setStarttlsEnabled(request.getStarttlsEnabled());
        if (request.getSslEnabled() != null) settings.setSslEnabled(request.getSslEnabled());
        if (request.getFromEmail() != null) settings.setFromEmail(trimToNull(request.getFromEmail()));
        if (request.getFromName() != null) settings.setFromName(trimToNull(request.getFromName()));

        if (Boolean.TRUE.equals(request.getClearPassword())) {
            settings.setPassword(null);
        } else if (request.getPassword() != null && !request.getPassword().isBlank()) {
            settings.setPassword(request.getPassword());
        }

        validateSmtpSettings(settings);

        SmtpSettings saved = smtpSettingsRepository.save(settings);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public void sendTestEmail(String toEmail) {
        SmtpSettings settings = getOrDefault();
        validateSmtpSettings(settings);
        sendEmail(settings, toEmail, "Test SMTP - Digital Card", "Ceci est un email de test SMTP.");
    }

    @Transactional(readOnly = true)
    public void notifyCardCreatedOrUpdated(CardDto card, boolean created) {
        SmtpSettings settings = getOrDefault();
        if (!settings.isEnabled()) {
            return;
        }

        try {
            validateSmtpSettings(settings);
            String subject = created
                    ? "Votre carte de visite numerique a ete creee"
                    : "Votre carte de visite numerique a ete mise a jour";
            String body = buildEmployeeEmailBody(card, created);
            sendEmail(settings, card.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("Email notification skipped for {}: {}", card.getEmail(), ex.getMessage());
        }
    }

    private void sendEmail(SmtpSettings settings, String toEmail, String subject, String body) {
        JavaMailSenderImpl sender = buildMailSender(settings);

        SimpleMailMessage message = new SimpleMailMessage();
        if (settings.getFromEmail() != null) {
            if (settings.getFromName() != null && !settings.getFromName().isBlank()) {
                message.setFrom(settings.getFromName().trim() + " <" + settings.getFromEmail().trim() + ">");
            } else {
                message.setFrom(settings.getFromEmail().trim());
            }
        }
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        sender.send(message);
    }

    private JavaMailSenderImpl buildMailSender(SmtpSettings settings) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(settings.getHost());
        sender.setPort(Optional.ofNullable(settings.getPort()).orElse(587));
        sender.setUsername(settings.getUsername());
        sender.setPassword(settings.getPassword());
        sender.setProtocol(Optional.ofNullable(settings.getProtocol()).orElse("smtp"));

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", String.valueOf(settings.isAuth()));
        props.put("mail.smtp.starttls.enable", String.valueOf(settings.isStarttlsEnabled()));
        props.put("mail.smtp.ssl.enable", String.valueOf(settings.isSslEnabled()));
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        return sender;
    }

    private String buildEmployeeEmailBody(CardDto card, boolean created) {
        String action = created ? "cree" : "mise a jour";
        String fullName = (safe(card.getFirstName()) + " " + safe(card.getLastName())).trim();
        String greeting = fullName.isBlank() ? "Bonjour," : "Bonjour " + fullName + ",";

        String cardLink = "/card?email=" + URLEncoder.encode(card.getEmail(), StandardCharsets.UTF_8);

        return greeting + "\n\n"
                + "Votre carte de visite numerique a ete " + action + ".\n"
                + "Vous pouvez la consulter ici: " + cardLink + "\n\n"
                + "Cordialement,\n"
                + "Equipe RH";
    }

    private SmtpSettings getOrDefault() {
        return smtpSettingsRepository.findById(SETTINGS_ID)
                .orElseGet(this::createDefault);
    }

    private SmtpSettings createDefault() {
        return SmtpSettings.builder()
                .id(SETTINGS_ID)
                .enabled(false)
                .host(null)
                .port(587)
                .username(null)
                .password(null)
                .protocol("smtp")
                .auth(true)
                .starttlsEnabled(true)
                .sslEnabled(false)
                .fromEmail(null)
                .fromName("Digital Card")
                .build();
    }

    private void validateSmtpSettings(SmtpSettings settings) {
        if (!settings.isEnabled()) {
            return;
        }

        if (settings.getHost() == null || settings.getHost().isBlank()) {
            throw new IllegalArgumentException("SMTP host is required when notifications are enabled.");
        }
        if (settings.getFromEmail() == null || settings.getFromEmail().isBlank()) {
            throw new IllegalArgumentException("SMTP from email is required when notifications are enabled.");
        }
        if (settings.isAuth() && (settings.getUsername() == null || settings.getUsername().isBlank())) {
            throw new IllegalArgumentException("SMTP username is required when auth is enabled.");
        }
        if (settings.isAuth() && (settings.getPassword() == null || settings.getPassword().isBlank())) {
            throw new IllegalArgumentException("SMTP password is required when auth is enabled.");
        }
    }

    private SmtpSettingsDto toDto(SmtpSettings settings) {
        return SmtpSettingsDto.builder()
                .enabled(settings.isEnabled())
                .host(settings.getHost())
                .port(settings.getPort())
                .username(settings.getUsername())
                .hasPassword(settings.getPassword() != null && !settings.getPassword().isBlank())
                .protocol(settings.getProtocol())
                .auth(settings.isAuth())
                .starttlsEnabled(settings.isStarttlsEnabled())
                .sslEnabled(settings.isSslEnabled())
                .fromEmail(settings.getFromEmail())
                .fromName(settings.getFromName())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
