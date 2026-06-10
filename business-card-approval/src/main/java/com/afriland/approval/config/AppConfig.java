package com.afriland.approval.config;

import com.afriland.approval.model.AdminCredentials;
import com.afriland.approval.model.SmtpConfig;
import com.afriland.approval.repository.AdminCredentialsRepository;
import com.afriland.approval.repository.SmtpConfigRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.security.MessageDigest;

@Configuration
public class AppConfig {

    @Bean
    CommandLineRunner initData(AdminCredentialsRepository adminRepo, SmtpConfigRepository smtpRepo) {
        return args -> {
            if (adminRepo.count() == 0) {
                AdminCredentials admin = new AdminCredentials();
                admin.setUsername("admin");
                admin.setPassword(sha256("afriland2024"));
                adminRepo.save(admin);
                System.out.println("[INIT] Default admin created: admin / afriland2024");
            }
            if (smtpRepo.count() == 0) {
                SmtpConfig smtp = new SmtpConfig();
                smtpRepo.save(smtp);
                System.out.println("[INIT] Default SMTP config created");
            }
        };
    }

    public static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
