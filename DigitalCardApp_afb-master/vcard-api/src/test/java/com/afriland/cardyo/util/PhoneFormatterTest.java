package com.afriland.cardyo.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class PhoneFormatterTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t"})
    void format_returnsInputUnchanged_whenNullOrBlank(String input) {
        assertThat(PhoneFormatter.format(input)).isEqualTo(input);
    }

    @Test
    void format_returnsInput_whenNoDigitsAreFound() {
        assertThat(PhoneFormatter.format("abcd")).isEqualTo("abcd");
    }

    @ParameterizedTest
    @CsvSource({
            "'699123456', '699 123 456'",
            "'222233068',  '222 233 068'",
            "'12345',      '123 45'",
            "'123',        '123'",
            "'1',          '1'"
    })
    void format_groupsDigitsByThree(String raw, String expected) {
        assertThat(PhoneFormatter.format(raw)).isEqualTo(expected);
    }

    @Test
    void format_stripsNonDigitCharactersBeforeGrouping() {
        assertThat(PhoneFormatter.format("+237 699-12.34 56")).isEqualTo("237 699 123 456");
    }
}
