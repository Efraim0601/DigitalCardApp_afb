package com.afriland.cardyo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminSessionFilter extends OncePerRequestFilter {

    private static final String COOKIE_NAME = "vcard_admin_session";

    private final AdminSessionTokenService tokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        String token = extractToken(request);

        // DEBUG LOG
        System.out.println("🔐 ADMIN FILTER - URL: " + request.getRequestURI());
        System.out.println("🔐 ADMIN FILTER - TOKEN: " + token);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            AdminSessionTokenService.TokenPayload payload = tokenService.verifyToken(token);

            System.out.println("🔐 ADMIN FILTER - PAYLOAD: " + payload);

            if (payload != null) {

                var auth = new UsernamePasswordAuthenticationToken(
                        payload.email(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

                SecurityContextHolder.getContext().setAuthentication(auth);

                System.out.println("✅ ADMIN AUTH SET FOR: " + payload.email());
            } else {
                System.out.println("❌ INVALID ADMIN TOKEN");
            }
        }

        chain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        if (request.getCookies() == null)
            return null;

        for (Cookie cookie : request.getCookies()) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}