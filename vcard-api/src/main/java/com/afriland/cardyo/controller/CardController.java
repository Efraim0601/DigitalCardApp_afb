package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.BulkDeleteRequest;
import com.afriland.cardyo.dto.CardCreateRequest;
import com.afriland.cardyo.dto.CardTemplateUpdateRequest;
import com.afriland.cardyo.dto.CardUpdateRequest;
import com.afriland.cardyo.service.AppearanceSettingsService;
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
    private final AppearanceSettingsService appearanceSettingsService;

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

    /**
     * Public endpoint allowing an employee to switch their card template.
     * Only honoured when the admin has enabled "Autoriser l'employé à choisir son modèle".
     */
    @PutMapping("/template")
    public ResponseEntity<Object> updateTemplate(
            @Valid @RequestBody CardTemplateUpdateRequest request) {

        if (!appearanceSettingsService.isUserTemplateAllowed()) {
            return ResponseEntity.status(403)
                    .body(Map.of(ApiKeys.ERROR, "User template selection is disabled"));
        }
        if (!appearanceSettingsService.isTemplateSupported(request.getTemplateId())) {
            return ResponseEntity.badRequest()
                    .body(Map.of(ApiKeys.ERROR, "Unsupported template: " + request.getTemplateId()));
        }
        return ResponseEntity.ok(cardService.updateTemplate(
                request.getEmail(),
                request.getTemplateId().trim().toLowerCase()));
    }
}
