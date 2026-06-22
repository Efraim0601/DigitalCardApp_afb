package com.afriland.cardyo.entity;

/**
 * Validation lifecycle of a card.
 * <ul>
 *   <li>{@link #APPROVED} — usable everywhere (admin-created cards, or client cards validated by an admin).</li>
 *   <li>{@link #PENDING} — created from the public client portal, awaiting admin validation; viewable but not usable.</li>
 *   <li>{@link #REJECTED} — declined by an admin; viewable but not usable.</li>
 * </ul>
 */
public enum CardStatus {
    PENDING,
    APPROVED,
    REJECTED
}
