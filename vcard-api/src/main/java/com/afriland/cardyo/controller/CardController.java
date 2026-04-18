package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.BulkDeleteRequest;
import com.afriland.cardyo.dto.CardCreateRequest;
import com.afriland.cardyo.dto.CardUpdateRequest;
import com.afriland.cardyo.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @GetMapping
    public ResponseEntity<Object> getCards(
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(required = false) String q,
            Authentication auth) {

        if (email != null && !email.isBlank()) {
            return ResponseEntity.ok(cardService.findByEmail(email));
        }

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(Map.of(ApiKeys.ERROR, "Unauthorized"));
        }
        return ResponseEntity.ok(cardService.findAll(limit, offset, q));
    }

    @PostMapping
    public ResponseEntity<Object> createCard(
            @Valid @RequestBody CardCreateRequest request) {
        return ResponseEntity.ok(cardService.upsert(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateCard(@PathVariable UUID id,
                                        @RequestBody CardUpdateRequest request) {
        return ResponseEntity.ok(cardService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteCard(@PathVariable UUID id) {
        cardService.delete(id);
        return ResponseEntity.ok(Map.of(ApiKeys.SUCCESS, true));
    }

    @PostMapping("/increment-share/{email}")
    public ResponseEntity<Object> incrementShareCount(@PathVariable String email) {
        cardService.incrementShareCount(email);
        return ResponseEntity.ok(Map.of(ApiKeys.SUCCESS, true));
    }
}
