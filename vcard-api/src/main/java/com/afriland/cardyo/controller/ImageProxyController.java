package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.ImageConvertResponse;
import com.afriland.cardyo.service.ImageProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ImageProxyController {

    private final ImageProxyService imageProxyService;

    @GetMapping("/convertImage")
    public ResponseEntity<Object> convertImage(@RequestParam String url) {
        try {
            String base64 = imageProxyService.fetchAsBase64(url);
            return ResponseEntity.ok(new ImageConvertResponse(base64));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(503)
                    .body(Map.of(ApiKeys.ERROR, "Image fetch interrupted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(ApiKeys.ERROR, "Failed to fetch image: " + e.getMessage()));
        }
    }
}
