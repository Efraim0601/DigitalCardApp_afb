package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.SmtpSettingsDto;
import com.afriland.cardyo.service.SmtpSettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminSmtpControllerTest {

    @Mock private SmtpSettingsService smtpSettingsService;
    @InjectMocks private AdminSmtpController controller;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getSettings_returnsDto() throws Exception {
        when(smtpSettingsService.getSettings()).thenReturn(
                SmtpSettingsDto.builder().enabled(false).host("smtp.example.com").build());

        mvc.perform(get("/api/admin/smtp-settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.host").value("smtp.example.com"));
    }

    @Test
    void updateSettings_delegates() throws Exception {
        when(smtpSettingsService.updateSettings(any())).thenReturn(
                SmtpSettingsDto.builder().enabled(true).host("smtp.example.com").build());

        mvc.perform(put("/api/admin/smtp-settings")
                        .contentType("application/json")
                        .content("{\"enabled\":true,\"host\":\"smtp.example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    void sendTestEmail_returnsSuccess() throws Exception {
        mvc.perform(post("/api/admin/smtp-settings/test")
                        .contentType("application/json")
                        .content("{\"toEmail\":\"user@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        verify(smtpSettingsService).sendTestEmail("user@example.com");
    }
}
