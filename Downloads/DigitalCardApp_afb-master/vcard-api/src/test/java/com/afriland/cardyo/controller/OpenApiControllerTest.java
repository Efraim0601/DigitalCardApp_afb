package com.afriland.cardyo.controller;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiControllerTest {

    @Test
    void openApi_forwardsToApiDocs() {
        assertThat(new OpenApiController().openApi()).isEqualTo("forward:/v3/api-docs");
    }
}
