package com.afriland.cardyo.entity;

import java.time.Instant;
import java.util.UUID;

public interface LabelEntity {

    UUID getId();

    String getLabelFr();
    void setLabelFr(String labelFr);

    String getLabelEn();
    void setLabelEn(String labelEn);

    Instant getCreatedAt();
}
