package com.afriland.cardyo.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ScryptPasswordEncoderTest {

    private final ScryptPasswordEncoder encoder = new ScryptPasswordEncoder();

    @Test
    void encode_producesVersionedOutputWithSaltAndHash() {
        String encoded = encoder.encode("hunter2");

        assertThat(encoded).startsWith("v1$");
        assertThat(encoded.split("\\$")).hasSize(3);
    }

    @Test
    void encode_producesDifferentHashesForSamePassword_thanksToRandomSalt() {
        String a = encoder.encode("same-password");
        String b = encoder.encode("same-password");

        assertThat(a).isNotEqualTo(b);
    }

    @Test
    void matches_returnsTrue_whenPasswordMatchesEncodedValue() {
        String encoded = encoder.encode("correct-horse-battery-staple");

        assertThat(encoder.matches("correct-horse-battery-staple", encoded)).isTrue();
    }

    @Test
    void matches_returnsFalse_whenPasswordDiffers() {
        String encoded = encoder.encode("expected");

        assertThat(encoder.matches("different", encoded)).isFalse();
    }

    @Test
    void matches_returnsFalse_whenEncodedValueIsNull() {
        assertThat(encoder.matches("anything", null)).isFalse();
    }

    @Test
    void matches_returnsFalse_whenEncodedValueHasWrongPrefix() {
        assertThat(encoder.matches("anything", "v2$aaaa$bbbb")).isFalse();
    }

    @Test
    void matches_returnsFalse_whenEncodedValueIsMalformed() {
        assertThat(encoder.matches("anything", "v1$only-one-part")).isFalse();
    }

    @Test
    void matches_returnsFalse_whenSaltIsNotValidBase64() {
        assertThat(encoder.matches("anything", "v1$!!!not-b64!!!$bbbb")).isFalse();
    }
}
