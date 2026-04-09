package com.afriland.cardyo.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BulkDeleteRequest {
    @NotEmpty
    @Size(max = 500)
    private List<UUID> ids;
}
