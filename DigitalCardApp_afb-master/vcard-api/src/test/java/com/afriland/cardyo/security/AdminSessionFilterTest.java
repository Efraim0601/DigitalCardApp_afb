package com.afriland.cardyo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSessionFilterTest {

    @Mock private AdminSessionTokenService tokenService;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain chain;

    @InjectMocks private AdminSessionFilter filter;

    @BeforeEach
    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticates_whenValidTokenCookiePresent() throws Exception {
        Cookie cookie = new Cookie("vcard_admin_session", "token-123");
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});
        when(tokenService.verifyToken("token-123"))
                .thenReturn(new AdminSessionTokenService.TokenPayload("admin@x.com", 1L));

        filter.doFilter(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo("admin@x.com");
        assertThat(auth.getAuthorities()).extracting(Object::toString).contains("ROLE_ADMIN");
        verify(chain).doFilter(request, response);
    }

    @Test
    void skipsAuthentication_whenTokenInvalid() throws Exception {
        Cookie cookie = new Cookie("vcard_admin_session", "bad");
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});
        when(tokenService.verifyToken("bad")).thenReturn(null);

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
    }

    @Test
    void skipsAuthentication_whenCookieMissing() throws Exception {
        Cookie other = new Cookie("other", "v");
        when(request.getCookies()).thenReturn(new Cookie[]{other});

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
    }

    @Test
    void skipsAuthentication_whenNoCookiesAtAll() throws Exception {
        when(request.getCookies()).thenReturn(null);

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
    }
}
