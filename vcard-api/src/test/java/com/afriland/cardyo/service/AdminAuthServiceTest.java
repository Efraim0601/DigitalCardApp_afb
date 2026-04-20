package com.afriland.cardyo.service;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.CredentialsResponse;
import com.afriland.cardyo.entity.AdminLogin;
import com.afriland.cardyo.repository.AdminLoginRepository;
import com.afriland.cardyo.security.AdminSessionTokenService;
import com.afriland.cardyo.security.ScryptPasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock
    private AdminLoginRepository adminLoginRepository;

    @Mock
    private ScryptPasswordEncoder passwordEncoder;

    @Mock
    private AdminSessionTokenService tokenService;

    private final AppProperties appProperties = new AppProperties();

    private AdminAuthService service;

    @BeforeEach
    void setUp() {
        appProperties.getAdmin().setEmail("fallback@example.com");
        appProperties.getAdmin().setPassword("fallback-password");
        service = new AdminAuthService(adminLoginRepository, passwordEncoder, tokenService, appProperties);
    }

    @Test
    void authenticate_fallsBackToAppProperties_whenNoDatabaseAdmin() {
        when(adminLoginRepository.findById(1)).thenReturn(Optional.empty());

        assertThat(service.authenticate("fallback@example.com", "fallback-password")).isTrue();
        assertThat(service.authenticate("fallback@example.com", "wrong")).isFalse();
        assertThat(service.authenticate("unknown@example.com", "fallback-password")).isFalse();
    }

    @Test
    void authenticate_usesDatabaseAdmin_whenPresent() {
        AdminLogin admin = new AdminLogin();
        admin.setId(1);
        admin.setEmail("db@example.com");
        admin.setPasswordHash("hashed");
        when(adminLoginRepository.findById(1)).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("raw", "hashed")).thenReturn(true);

        assertThat(service.authenticate("db@example.com", "raw")).isTrue();
    }

    @Test
    void authenticate_isCaseInsensitiveOnEmail_whenDatabaseAdminExists() {
        AdminLogin admin = new AdminLogin();
        admin.setId(1);
        admin.setEmail("db@example.com");
        admin.setPasswordHash("hashed");
        when(adminLoginRepository.findById(1)).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("raw", "hashed")).thenReturn(true);

        assertThat(service.authenticate("DB@Example.COM", "raw")).isTrue();
    }

    @Test
    void authenticate_returnsFalse_whenPasswordDoesNotMatchDatabaseAdmin() {
        AdminLogin admin = new AdminLogin();
        admin.setId(1);
        admin.setEmail("db@example.com");
        admin.setPasswordHash("hashed");
        when(adminLoginRepository.findById(1)).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("bad", "hashed")).thenReturn(false);

        assertThat(service.authenticate("db@example.com", "bad")).isFalse();
    }

    @Test
    void createSessionToken_delegatesToTokenService() {
        when(tokenService.createToken("admin@example.com")).thenReturn("token-value");

        assertThat(service.createSessionToken("admin@example.com")).isEqualTo("token-value");
    }

    @Test
    void getCredentials_reportsStoredInDatabase_whenAdminRowExists() {
        AdminLogin admin = new AdminLogin();
        admin.setId(1);
        admin.setEmail("db@example.com");
        admin.setPasswordHash("hashed");
        when(adminLoginRepository.findById(1)).thenReturn(Optional.of(admin));

        CredentialsResponse creds = service.getCredentials();

        assertThat(creds.getEmail()).isEqualTo("db@example.com");
        assertThat(creds.isStoredInDatabase()).isTrue();
    }

    @Test
    void getCredentials_reportsFallback_whenAdminRowMissing() {
        when(adminLoginRepository.findById(1)).thenReturn(Optional.empty());

        CredentialsResponse creds = service.getCredentials();

        assertThat(creds.getEmail()).isEqualTo("fallback@example.com");
        assertThat(creds.isStoredInDatabase()).isFalse();
    }

    @Test
    void getAdminEmail_returnsDatabaseEmailWhenPresent_andFallbackOtherwise() {
        when(adminLoginRepository.findById(1)).thenReturn(Optional.empty());
        assertThat(service.getAdminEmail()).isEqualTo("fallback@example.com");

        AdminLogin admin = new AdminLogin();
        admin.setId(1);
        admin.setEmail("db@example.com");
        admin.setPasswordHash("hashed");
        when(adminLoginRepository.findById(1)).thenReturn(Optional.of(admin));
        assertThat(service.getAdminEmail()).isEqualTo("db@example.com");
    }

    @Test
    void isAdminEmail_comparesCaseInsensitively() {
        when(adminLoginRepository.findById(1)).thenReturn(Optional.empty());

        assertThat(service.isAdminEmail("Fallback@Example.com")).isTrue();
        assertThat(service.isAdminEmail("someoneelse@example.com")).isFalse();
    }

    @Test
    void updateCredentials_rejectsWhenCurrentPasswordIsWrong() {
        when(adminLoginRepository.findById(1)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.updateCredentials("wrong", "new@example.com", "new-password"))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    void updateCredentials_createsAdminRowWithEncodedPassword_whenDatabaseIsEmpty() {
        when(adminLoginRepository.findById(1)).thenReturn(Optional.empty());
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new");
        when(adminLoginRepository.save(any(AdminLogin.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.updateCredentials("fallback-password", "new@example.com", "new-password");

        ArgumentCaptor<AdminLogin> captor = ArgumentCaptor.forClass(AdminLogin.class);
        verify(adminLoginRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("new@example.com");
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("encoded-new");
    }

    @Test
    void updateCredentials_keepsExistingPasswordHash_whenOnlyEmailChanges() {
        AdminLogin existing = new AdminLogin();
        existing.setId(1);
        existing.setEmail("db@example.com");
        existing.setPasswordHash("old-hash");
        when(adminLoginRepository.findById(1)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches(eq("current"), anyString())).thenReturn(true);
        when(adminLoginRepository.save(any(AdminLogin.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.updateCredentials("current", "renamed@example.com", null);

        ArgumentCaptor<AdminLogin> captor = ArgumentCaptor.forClass(AdminLogin.class);
        verify(adminLoginRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("renamed@example.com");
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("old-hash");
    }
}
