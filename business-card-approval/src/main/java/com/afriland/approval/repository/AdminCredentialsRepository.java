package com.afriland.approval.repository;

import com.afriland.approval.model.AdminCredentials;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdminCredentialsRepository extends JpaRepository<AdminCredentials, Long> {
    Optional<AdminCredentials> findByUsernameAndPassword(String username, String password);
}
