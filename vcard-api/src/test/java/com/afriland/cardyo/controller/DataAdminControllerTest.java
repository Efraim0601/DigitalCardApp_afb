package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.ImportResultDto;
import com.afriland.cardyo.service.DataExportService;
import com.afriland.cardyo.service.DataImportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DataAdminControllerTest {

    @Mock private DataImportService importService;
    @Mock private DataExportService exportService;

    @InjectMocks private DataAdminController controller;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void importData_passesFileAndScopeToService() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "sample.csv", "text/csv", "email\nx@y.com".getBytes());
        when(importService.importData(any(), eq("cards"))).thenReturn(
                ImportResultDto.builder().success(true)
                        .warnings(List.of())
                        .imported(ImportResultDto.ImportCounts.builder().cards(1).build())
                        .build());

        mvc.perform(multipart("/api/admin/data-import").file(file).param("scope", "cards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.imported.cards").value(1));
    }

    @Test
    void exportData_returnsCsvWithAttachmentHeader() throws Exception {
        when(exportService.exportCsv("cards"))
                .thenReturn("email\nx@y.com".getBytes(StandardCharsets.UTF_8));
        when(exportService.getFilename("cards")).thenReturn("cartes.csv");

        mvc.perform(get("/api/admin/data-export").param("scope", "cards"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"cartes.csv\""))
                .andExpect(content().string("email\nx@y.com"));
    }

    @Test
    void exportData_xlsxFormatReturnsXlsxAttachment() throws Exception {
        byte[] xlsx = new byte[]{1, 2, 3};
        when(exportService.exportXlsx("cards")).thenReturn(xlsx);
        when(exportService.getXlsxFilename("cards")).thenReturn("cartes.xlsx");

        mvc.perform(get("/api/admin/data-export").param("scope", "cards").param("format", "xlsx"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"cartes.xlsx\""))
                .andExpect(header().string("Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    void exportTemplate_returnsXlsxAttachment() throws Exception {
        byte[] tpl = new byte[]{9, 8, 7};
        when(exportService.exportTemplateXlsx("cards")).thenReturn(tpl);
        when(exportService.getTemplateFilename("cards")).thenReturn("modele-cartes.xlsx");

        mvc.perform(get("/api/admin/data-template").param("scope", "cards"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"modele-cartes.xlsx\""));
    }
}
