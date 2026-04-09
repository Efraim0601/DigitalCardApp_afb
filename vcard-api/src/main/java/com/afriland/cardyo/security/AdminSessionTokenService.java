package com.afriland.cardyo.security;

import com.afriland.cardyo.config.AppProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminSessionTokenService {

    private static final long SESSION_DURATION_SECONDS = 8 * 60 * 60;
    private static final String HMAC_ALGO = "HmacSHA256";

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private byte[] secretKey;

    @PostConstruct
    void init() {
        secretKey = appProperties.getAdmin().getSessionSecret().getBytes();
    }

    public String createToken(String email) {
        try {
            long exp = Instant.now().getEpochSecond() + SESSION_DURATION_SECONDS;
            String payload = objectMapper.writeValueAsString(Map.of("email", email, "exp", exp));
            String payloadB64 = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(payload.getBytes());
            String signature = sign(payloadB64);
            return payloadB64 + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create session token", e);
        }
    }

    public record TokenPayload(String email, long exp) {}

    public TokenPayload verifyToken(String token) {
        if (token == null || !token.contains(".")) return null;
        try {
            String[] parts = token.split("\\.", 2);
            if (parts.length != 2) return null;

            String expectedSig = sign(parts[0]);
            if (!MessageDigest.isEqual(
                    expectedSig.getBytes(), parts[1].getBytes())) {
                return null;
            }

            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[0]);
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(payloadBytes, Map.class);

            String email = (String) map.get("email");
            long exp = ((Number) map.get("exp")).longValue();

            if (Instant.now().getEpochSecond() > exp) return null;

            return new TokenPayload(email, exp);
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGO);
        mac.init(new SecretKeySpec(secretKey, HMAC_ALGO));
        byte[] sig = mac.doFinal(data.getBytes());
        return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
    }
}
