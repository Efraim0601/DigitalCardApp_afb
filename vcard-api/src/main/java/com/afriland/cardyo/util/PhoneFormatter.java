package com.afriland.cardyo.util;

public final class PhoneFormatter {

    private PhoneFormatter() {}

    /**
     * Strips non-digit characters then groups digits by three, separated by spaces.
     * Example: "699123456" → "699 123 456"
     */
    public static String format(String mobile) {
        if (mobile == null || mobile.isBlank()) return mobile;
        String digits = mobile.replaceAll("\\D", "");
        if (digits.isEmpty()) return mobile;

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < digits.length(); i++) {
            if (i > 0 && i % 3 == 0) sb.append(' ');
            sb.append(digits.charAt(i));
        }
        return sb.toString();
    }
}
