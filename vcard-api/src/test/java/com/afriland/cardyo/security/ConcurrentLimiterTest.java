package com.afriland.cardyo.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ConcurrentLimiterTest {

    @Test
    void tryAcquireLogin_succeedsUpToTwentyConcurrentPermits() {
        ConcurrentLimiter limiter = new ConcurrentLimiter();

        int acquired = 0;
        for (int i = 0; i < 20; i++) {
            if (limiter.tryAcquireLogin()) acquired++;
        }

        assertThat(acquired).isEqualTo(20);
    }

    @Test
    void tryAcquireLogin_failsWhenAllPermitsExhausted_andRecoversAfterRelease() {
        ConcurrentLimiter limiter = new ConcurrentLimiter();

        for (int i = 0; i < 20; i++) {
            assertThat(limiter.tryAcquireLogin()).isTrue();
        }
        assertThat(limiter.tryAcquireLogin()).isFalse();

        limiter.releaseLogin();
        assertThat(limiter.tryAcquireLogin()).isTrue();
    }
}
