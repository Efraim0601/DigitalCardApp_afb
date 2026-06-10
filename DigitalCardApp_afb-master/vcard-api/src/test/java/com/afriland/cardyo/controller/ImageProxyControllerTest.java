package com.afriland.cardyo.controller;

import com.afriland.cardyo.service.ImageProxyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ImageProxyControllerTest {

    @Mock private ImageProxyService service;
    @InjectMocks private ImageProxyController controller;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void convertImage_returnsBase64OnSuccess() throws Exception {
        when(service.fetchAsBase64("https://example.com/a.png"))
                .thenReturn("aGVsbG8=");

        mvc.perform(get("/api/convertImage").param("url", "https://example.com/a.png"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.base64").value("aGVsbG8="));
    }

    @Test
    void convertImage_returnsBadRequestOnFailure() throws Exception {
        when(service.fetchAsBase64("https://bad"))
                .thenThrow(new IOException("404"));

        mvc.perform(get("/api/convertImage").param("url", "https://bad"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
