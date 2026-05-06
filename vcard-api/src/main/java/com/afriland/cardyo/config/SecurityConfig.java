package com.afriland.cardyo.config;

import com.afriland.cardyo.security.AdminSessionFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

/**
 * Stateless admin security:
 * <ul>
 *   <li>Session cookie is {@code HttpOnly + Secure + SameSite=Strict} (see AdminAuthController).</li>
 *   <li>CSRF protection is active on every mutating request: token issued via a cookie
 *       ({@link CookieCsrfTokenRepository#withHttpOnlyFalse()}) and validated against the
 *       {@code X-XSRF-TOKEN} header using the plain {@link CsrfTokenRequestAttributeHandler}
 *       so that Angular's built-in XSRF interceptor (which echoes the raw cookie value back
 *       in the header) matches what the server has stored.</li>
 *   <li>Eager resolution ({@code setCsrfRequestAttributeName(null)}) ensures the XSRF-TOKEN
 *       cookie is emitted on the first GET, so the SPA has a token before the login POST.</li>
 * </ul>
 *
 * <p><b>Why the XSRF cookie is not HttpOnly (S3330):</b> the browser-side Angular HttpClient
 * must read the cookie value to echo it back in the {@code X-XSRF-TOKEN} header. Marking the
 * cookie HttpOnly would break the double-submit-cookie pattern and disable CSRF protection
 * altogether. The token is short-lived and bound to the session; its only sensitive use is
 * CSRF mitigation.</p>
 */
@SuppressWarnings("java:S3330") // XSRF-TOKEN must be JS-readable for the double-submit-cookie pattern
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AdminSessionFilter adminSessionFilter;
    private final AppProperties appProperties;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        CookieCsrfTokenRepository csrfRepo = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepo.setCookieCustomizer(c -> c
                .sameSite(appProperties.getCookie().getSameSite())
                .secure(appProperties.getCookie().isSecure())
                .path("/"));

        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfRepo)
                .csrfTokenRequestHandler(csrfHandler))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(adminSessionFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> {
                    res.setContentType("application/json");
                    res.setStatus(401);
                    res.getWriter().write("{\"error\":\"Unauthorized\"}");
                })
                .accessDeniedHandler((req, res, denied) -> {
                    res.setContentType("application/json");
                    res.setStatus(403);
                    res.getWriter().write("{\"error\":\"Forbidden\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/admin/login",
                    "/api/auth/admin/login/",
                    "/api/auth/admin/logout",
                    "/api/auth/admin/logout/",
                    "/api/auth/admin/me",
                    "/api/auth/admin/me/",
                    "/api/auth/login-hint",
                    "/api/auth/login-hint/"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/cards").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/cards/increment-share/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/cards/template").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/appearance-settings").permitAll()
                .requestMatchers("/api/convertImage").permitAll()
                .requestMatchers(
                    "/api/openapi", "/v3/api-docs/**",
                    "/swagger-ui/**", "/swagger-ui.html"
                ).permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/**").hasRole("ADMIN")
                .anyRequest().permitAll()
            );

        return http.build();
    }
}
