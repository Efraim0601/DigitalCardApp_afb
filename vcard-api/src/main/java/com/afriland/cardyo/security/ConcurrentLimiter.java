package com.afriland.cardyo.security;

import org.springframework.stereotype.Component;

import java.util.concurrent.Semaphore;

@Component
public class ConcurrentLimiter {

    private final Semaphore loginSemaphore = new Semaphore(20);

    public boolean tryAcquireLogin() {
        return loginSemaphore.tryAcquire();
    }

    public void releaseLogin() {
        loginSemaphore.release();
    }
}
