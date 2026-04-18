package com.afriland.cardyo.controller;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.CredentialsResponse;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.security.ConcurrentLimiter;
import com.afriland.cardyo.service.AdminAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminAuthControllerTest {

    @Mock private AdminAuthService authService;
    @Mock private ConcurrentLimiter limiter;
    @Mock private CardRepository cardRepository;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        AppProperties appProperties = new AppProperties();
        AdminAuthController controller = new AdminAuthController(
                authService, limiter, cardRepository, appProperties);
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void login_setsCookieOnSuccess() throws Exception {
        when(limiter.tryAcquireLogin()).thenReturn(true);
        when(authService.authenticate("admin@x.com", "pwd")).thenReturn(true);
        when(authService.createSessionToken("admin@x.com")).thenReturn("TOK");

        mvc.perform(post("/api/auth/admin/login")
                        .contentType("application/json")
                        .content("{\"email\":\"admin@x.com\",\"password\":\"pwd\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().value("vcard_admin_session", "TOK"))
                .andExpect(jsonPath("$.success").value(true));
        verify(limiter).releaseLogin();
    }

    @Test
    void login_rejectsBadCredentials() throws Exception {
        when(limiter.tryAcquireLogin()).thenReturn(true);
        when(authService.authenticate(anyString(), anyString())).thenReturn(false);

        mvc.perform(post("/api/auth/admin/login")
                        .contentType("application/json")
                        .content("{\"email\":\"admin@x.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_returns429WhenRateLimited() throws Exception {
        when(limiter.tryAcquireLogin()).thenReturn(false);

        mvc.perform(post("/api/auth/admin/login")
                        .contentType("application/json")
                        .content("{\"email\":\"admin@x.com\",\"password\":\"pwd\"}"))
                .andExpect(status().is(429));
    }

    @Test
    void logout_clearsCookie() throws Exception {
        mvc.perform(post("/api/auth/admin/logout"))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("vcard_admin_session", 0));
    }

    @Test
    void me_returns401WhenUnauthenticated() throws Exception {
        mvc.perform(get("/api/auth/admin/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    void me_returnsEmailWhenAuthenticated() throws Exception {
        mvc.perform(get("/api/auth/admin/me")
                        .principal(new UsernamePasswordAuthenticationToken("admin@x.com", null,
                                java.util.List.of())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.email").value("admin@x.com"));
    }

    @Test
    void getCredentials_delegates() throws Exception {
        when(authService.getCredentials()).thenReturn(
                CredentialsResponse.builder().email("admin@x.com").storedInDatabase(true).build());

        mvc.perform(get("/api/auth/admin/credentials"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@x.com"));
    }

    @Test
    void updateCredentials_returns401WhenSecurityException() throws Exception {
        org.mockito.Mockito.doThrow(new SecurityException("wrong password"))
                .when(authService).updateCredentials(anyString(), any(), any());

        mvc.perform(put("/api/auth/admin/credentials")
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"bad\",\"newEmail\":\"a@b.c\",\"newPassword\":\"new\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateCredentials_setsCookieOnSuccess() throws Exception {
        when(authService.createSessionToken("new@x.com")).thenReturn("NEW-TOK");

        mvc.perform(put("/api/auth/admin/credentials")
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"pwd\",\"newEmail\":\"new@x.com\",\"newPassword\":\"new\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().value("vcard_admin_session", "NEW-TOK"));
    }

    @Test
    void loginHint_returnsBothFlags() throws Exception {
        when(authService.isAdminEmail("known@x.com")).thenReturn(true);
        when(cardRepository.existsByEmailIgnoreCase("known@x.com")).thenReturn(true);

        mvc.perform(get("/api/auth/login-hint").param("email", "known@x.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminEmail").value(true))
                .andExpect(jsonPath("$.hasCard").value(true));
    }
}
