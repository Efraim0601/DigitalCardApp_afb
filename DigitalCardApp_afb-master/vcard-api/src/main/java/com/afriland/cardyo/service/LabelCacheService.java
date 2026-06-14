package com.afriland.cardyo.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Service
public class LabelCacheService {

    private static final long TTL_MS = 5 * 60 * 1000L;

    private final ConcurrentHashMap<String, CacheEntry> store = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <T> List<T> getOrLoad(String key, Supplier<List<T>> loader) {
        CacheEntry entry = store.get(key);
        if (entry != null && System.currentTimeMillis() < entry.expiresAt) {
            return (List<T>) entry.data;
        }
        List<T> data = loader.get();
        store.put(key, new CacheEntry(data, System.currentTimeMillis() + TTL_MS));
        return data;
    }

    public void invalidate(String key) {
        store.remove(key);
    }

    private record CacheEntry(List<?> data, long expiresAt) {}
}
