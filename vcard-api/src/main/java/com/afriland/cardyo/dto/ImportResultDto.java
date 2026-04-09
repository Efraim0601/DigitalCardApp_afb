package com.afriland.cardyo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImportResultDto {
    private boolean success;
    private ImportCounts imported;
    private List<String> warnings;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ImportCounts {
        private int departments;
        private int jobTitles;
        private int cards;
    }
}
