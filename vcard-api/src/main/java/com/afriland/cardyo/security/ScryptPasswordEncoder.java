package com.afriland.cardyo.security;

import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class ScryptPasswordEncoder implements PasswordEncoder {

    private static final int N = 16384;
    private static final int R = 8;
    private static final int P = 1;
    private static final int KEY_LEN = 64;
    private static final int SALT_LEN = 16;

    private final SecureRandom random = new SecureRandom();

    @Override
    public String encode(CharSequence rawPassword) {
        byte[] salt = new byte[SALT_LEN];
        random.nextBytes(salt);
        byte[] hash = SCrypt.generate(
                rawPassword.toString().getBytes(), salt, N, R, P, KEY_LEN);
        return "v1$"
                + Base64.getEncoder().encodeToString(salt) + "$"
                + Base64.getEncoder().encodeToString(hash);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (encodedPassword == null || !encodedPassword.startsWith("v1$")) {
            return false;
        }
        String[] parts = encodedPassword.split("\\$", 3);
        if (parts.length != 3) return false;

        try {
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[2]);
            byte[] actualHash = SCrypt.generate(
                    rawPassword.toString().getBytes(), salt, N, R, P, KEY_LEN);
            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (Exception e) {
            return false;
        }
    }
}
