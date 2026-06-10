package com.afriland.cardyo.service;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.CredentialsResponse;
import com.afriland.cardyo.entity.AdminLogin;
import com.afriland.cardyo.repository.AdminLoginRepository;
import com.afriland.cardyo.security.AdminSessionTokenService;
import com.afriland.cardyo.security.ScryptPasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminLoginRepository adminLoginRepository;
    private final ScryptPasswordEncoder passwordEncoder;
    private final AdminSessionTokenService tokenService;
    private final AppProperties appProperties;

    public boolean authenticate(String email, String password) {
        Optional<AdminLogin> dbAdmin = adminLoginRepository.findById(1);
        if (dbAdmin.isPresent()) {
            AdminLogin admin = dbAdmin.get();
            return admin.getEmail().equalsIgnoreCase(email)
                    && passwordEncoder.matches(password, admin.getPasswordHash());
        }
        return appProperties.getAdmin().getEmail().equalsIgnoreCase(email)
                && appProperties.getAdmin().getPassword().equals(password);
    }

    public String createSessionToken(String email) {
        return tokenService.createToken(email);
    }

    public CredentialsResponse getCredentials() {
        Optional<AdminLogin> dbAdmin = adminLoginRepository.findById(1);
        if (dbAdmin.isPresent()) {
            return CredentialsResponse.builder()
                    .email(dbAdmin.get().getEmail())
                    .storedInDatabase(true)
                    .build();
        }
        return CredentialsResponse.builder()
                .email(appProperties.getAdmin().getEmail())
                .storedInDatabase(false)
                .build();
    }

    @Transactional
    public void updateCredentials(String currentPassword,
                                  String newEmail,
                                  String newPassword) {
        if (!authenticateCurrentAdmin(currentPassword)) {
            throw new SecurityException("Invalid current password");
        }

        Optional<AdminLogin> existing = adminLoginRepository.findById(1);
        AdminLogin admin = existing.orElse(new AdminLogin());
        admin.setId(1);

        CredentialsResponse current = getCredentials();
        admin.setEmail(newEmail != null ? newEmail : current.getEmail());

        if (newPassword != null) {
            admin.setPasswordHash(passwordEncoder.encode(newPassword));
        } else if (existing.isPresent()) {
            admin.setPasswordHash(existing.get().getPasswordHash());
        } else {
            admin.setPasswordHash(
                    passwordEncoder.encode(appProperties.getAdmin().getPassword()));
        }

        adminLoginRepository.save(admin);
    }

    public String getAdminEmail() {
        Optional<AdminLogin> dbAdmin = adminLoginRepository.findById(1);
        return dbAdmin.map(AdminLogin::getEmail)
                .orElse(appProperties.getAdmin().getEmail());
    }

    public boolean isAdminEmail(String email) {
        return getAdminEmail().equalsIgnoreCase(email);
    }

    private boolean authenticateCurrentAdmin(String password) {
        Optional<AdminLogin> dbAdmin = adminLoginRepository.findById(1);
        if (dbAdmin.isPresent()) {
            return passwordEncoder.matches(password, dbAdmin.get().getPasswordHash());
        }
        return appProperties.getAdmin().getPassword().equals(password);
    }
}
