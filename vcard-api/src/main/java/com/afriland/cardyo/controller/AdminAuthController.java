package com.afriland.cardyo.controller;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.dto.*;
import com.afriland.cardyo.repository.CardRepository;
import com.afriland.cardyo.security.ConcurrentLimiter;
import com.afriland.cardyo.service.AdminAuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private static final String COOKIE_NAME = "vcard_admin_session";
    private static final Duration COOKIE_MAX_AGE = Duration.ofHours(8);

    private final AdminAuthService authService;
    private final ConcurrentLimiter limiter;
    private final CardRepository cardRepository;
    private final AppProperties appProperties;

    @PostMapping("/admin/login")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletResponse response) {
        if (!limiter.tryAcquireLogin()) {
            return ResponseEntity.status(429)
                    .body(Map.of(ApiKeys.ERROR, "Too many concurrent login requests"));
        }
        try {
            if (!authService.authenticate(request.getEmail(), request.getPassword())) {
                return ResponseEntity.status(401)
                        .body(Map.of(ApiKeys.ERROR, "Invalid credentials"));
            }
            String token = authService.createSessionToken(request.getEmail());
            addSessionCookie(response, token);
            return ResponseEntity.ok(Map.of(ApiKeys.SUCCESS, true));
        } finally {
            limiter.releaseLogin();
        }
    }

    @PostMapping("/admin/logout")
    public ResponseEntity<Object> logout(HttpServletResponse response) {
        ResponseCookie cookie = baseCookieBuilder("")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(Map.of(ApiKeys.SUCCESS, true));
    }

    @GetMapping("/admin/me")
    public ResponseEntity<Object> me(Authentication auth) {
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
    public ResponseEntity<Object> getCredentials() {
        return ResponseEntity.ok(authService.getCredentials());
    }

    @PutMapping("/admin/credentials")
    public ResponseEntity<Object> updateCredentials(
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
            return ResponseEntity.ok(Map.of(ApiKeys.SUCCESS, true));
        } catch (SecurityException e) {
            return ResponseEntity.status(401)
                    .body(Map.of(ApiKeys.ERROR, e.getMessage()));
        }
    }

    @GetMapping("/login-hint")
    public ResponseEntity<Object> loginHint(@RequestParam String email) {
        return ResponseEntity.ok(LoginHintResponse.builder()
                .isAdminEmail(authService.isAdminEmail(email))
                .hasCard(cardRepository.existsByEmailIgnoreCase(email))
                .build());
    }

    private void addSessionCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = baseCookieBuilder(token)
                .maxAge(COOKIE_MAX_AGE)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Builds the session cookie with hardened defaults:
     * HttpOnly (no JS access), Secure (HTTPS-only, disabled for local HTTP dev via app.cookie.secure=false),
     * SameSite=Strict (primary CSRF mitigation since the security filter chain disables CSRF tokens
     * — see SecurityConfig javadoc).
     */
    private ResponseCookie.ResponseCookieBuilder baseCookieBuilder(String value) {
        AppProperties.Cookie props = appProperties.getCookie();
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(props.isSecure())
                .sameSite(props.getSameSite())
                .path("/");
    }
}
