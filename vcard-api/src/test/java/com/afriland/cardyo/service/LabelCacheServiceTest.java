package com.afriland.cardyo.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class LabelCacheServiceTest {

    private final LabelCacheService service = new LabelCacheService();

    @Test
    void getOrLoad_invokesLoaderOnceAndCachesResult() {
        AtomicInteger calls = new AtomicInteger();
        List<String> first = service.getOrLoad("k1", () -> {
            calls.incrementAndGet();
            return List.of("a", "b");
        });
        List<String> second = service.getOrLoad("k1", () -> {
            calls.incrementAndGet();
            return List.of("should-not-be-returned");
        });

        assertThat(calls.get()).isEqualTo(1);
        assertThat(first).containsExactly("a", "b");
        assertThat(second).isSameAs(first);
    }

    @Test
    void invalidate_forcesReload() {
        AtomicInteger calls = new AtomicInteger();
        service.getOrLoad("k2", () -> {
            calls.incrementAndGet();
            return List.of("x");
        });
        service.invalidate("k2");
        service.getOrLoad("k2", () -> {
            calls.incrementAndGet();
            return List.of("y");
        });

        assertThat(calls.get()).isEqualTo(2);
    }

    @Test
    void invalidate_onUnknownKeyIsNoop() {
        assertThatCode(() -> service.invalidate("missing")).doesNotThrowAnyException();
    }
}
