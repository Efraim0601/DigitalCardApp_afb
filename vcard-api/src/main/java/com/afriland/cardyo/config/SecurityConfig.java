package com.afriland.cardyo.config;

import com.afriland.cardyo.security.AdminSessionFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Stateless admin security: session cookie is {@code HttpOnly + Secure + SameSite=Strict},
 * so browsers will not attach it to cross-site requests — which removes the CSRF attack
 * vector that the Spring CSRF filter protects against. The filter itself is therefore
 * disabled to keep the API stateless (no synchronizer token to propagate to the SPA).
 * <p>
 * If a form-based or cross-origin authenticated flow is ever added, re-enable CSRF with
 * {@code CookieCsrfTokenRepository.withHttpOnlyFalse()} and expose the XSRF-TOKEN cookie
 * to the SPA.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AdminSessionFilter adminSessionFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            // Safe: session cookie uses SameSite=Strict + HttpOnly + Secure (see AdminAuthController);
            // the API is stateless and has no form-based auth, so no synchronizer token is needed.
            .csrf(AbstractHttpConfigurer::disable)
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
