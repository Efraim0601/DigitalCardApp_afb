package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.*;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.security.ConcurrentLimiter;
import com.afriland.cardyo.service.AdminAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private static final String COOKIE_NAME = "vcard_admin_session";
    private static final int COOKIE_MAX_AGE = 8 * 60 * 60;

    private final AdminAuthService authService;
    private final ConcurrentLimiter limiter;
    private final CardRepository cardRepository;

    @PostMapping("/admin/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletResponse response) {
        if (!limiter.tryAcquireLogin()) {
            return ResponseEntity.status(429)
                    .body(Map.of("error", "Too many concurrent login requests"));
        }
        try {
            if (!authService.authenticate(request.getEmail(), request.getPassword())) {
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Invalid credentials"));
            }
            String token = authService.createSessionToken(request.getEmail());
            addSessionCookie(response, token);
            return ResponseEntity.ok(Map.of("success", true));
        } finally {
            limiter.releaseLogin();
        }
    }

    @PostMapping("/admin/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie(COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/admin/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(AuthMeResponse.builder().authenticated(false).build());
        }
        return ResponseEntity.ok(AuthMeResponse.builder()
                .authenticated(true)
                .email((String) auth.getPrincipal())
                .build());
    }

    @GetMapping("/admin/credentials")
    public ResponseEntity<?> getCredentials() {
        return ResponseEntity.ok(authService.getCredentials());
    }

    @PutMapping("/admin/credentials")
    public ResponseEntity<?> updateCredentials(
            @Valid @RequestBody CredentialsUpdateRequest request,
            HttpServletResponse response) {
        try {
            authService.updateCredentials(
                    request.getCurrentPassword(),
                    request.getNewEmail(),
                    request.getNewPassword());
            String email = request.getNewEmail() != null
                    ? request.getNewEmail()
                    : authService.getAdminEmail();
            String token = authService.createSessionToken(email);
            addSessionCookie(response, token);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (SecurityException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/login-hint")
    public ResponseEntity<?> loginHint(@RequestParam String email) {
        return ResponseEntity.ok(LoginHintResponse.builder()
                .isAdminEmail(authService.isAdminEmail(email))
                .hasCard(cardRepository.existsByEmailIgnoreCase(email))
                .build());
    }

    private void addSessionCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_MAX_AGE);
        response.addCookie(cookie);
    }
}
