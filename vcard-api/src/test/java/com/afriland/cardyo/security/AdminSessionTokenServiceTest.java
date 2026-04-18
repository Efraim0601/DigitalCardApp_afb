package com.afriland.cardyo.security;

import com.afriland.cardyo.config.AppProperties;
import com.afriland.cardyo.security.AdminSessionTokenService.TokenPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class AdminSessionTokenServiceTest {

    private AdminSessionTokenService service;

    @BeforeEach
    void setUp() throws Exception {
        AppProperties props = new AppProperties();
        props.getAdmin().setSessionSecret("unit-test-secret");
        service = new AdminSessionTokenService(props, new ObjectMapper());

        // Invoke @PostConstruct init() manually — no Spring context is bootstrapped here.
        Method init = AdminSessionTokenService.class.getDeclaredMethod("init");
        init.setAccessible(true);
        init.invoke(service);
    }

    @Test
    void createToken_producesTwoBase64PartsSeparatedByDot() {
        String token = service.createToken("admin@example.com");

        assertThat(token).contains(".");
        assertThat(token.split("\\.")).hasSize(2);
    }

    @Test
    void verifyToken_roundTripsTheEmailAndExpiry() {
        String token = service.createToken("admin@example.com");

        TokenPayload payload = service.verifyToken(token);

        assertThat(payload).isNotNull();
        assertThat(payload.email()).isEqualTo("admin@example.com");
        assertThat(payload.exp()).isGreaterThan(System.currentTimeMillis() / 1000);
    }

    @Test
    void verifyToken_returnsNull_whenTokenIsNull() {
        assertThat(service.verifyToken(null)).isNull();
    }

    @Test
    void verifyToken_returnsNull_whenTokenHasNoDot() {
        assertThat(service.verifyToken("no-dot-here")).isNull();
    }

    @Test
    void verifyToken_returnsNull_whenSignatureIsTampered() {
        String token = service.createToken("admin@example.com");
        String tampered = token.substring(0, token.length() - 1)
                + (token.endsWith("A") ? 'B' : 'A');

        assertThat(service.verifyToken(tampered)).isNull();
    }

    @Test
    void verifyToken_returnsNull_whenPayloadIsGarbage() {
        // Payload is not valid JSON → verifyToken must return null, not throw.
        assertThat(service.verifyToken("!!!not-base64!!!.abc")).isNull();
    }
}
