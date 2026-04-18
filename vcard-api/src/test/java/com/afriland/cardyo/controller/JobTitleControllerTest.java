package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.LabelDto;
import com.afriland.cardyo.dto.PagedResponse;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.service.LabelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class JobTitleControllerTest {

    @Mock private LabelService<JobTitle> labelService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new JobTitleController(labelService)).build();
    }

    @Test
    void list_delegates() throws Exception {
        when(labelService.findAll(anyInt(), anyInt(), any()))
                .thenReturn(PagedResponse.<LabelDto>builder()
                        .items(List.of()).total(0).limit(20).offset(0).build());

        mvc.perform(get("/api/job-titles"))
                .andExpect(status().isOk());
    }

    @Test
    void delete_returnsSuccess() throws Exception {
        UUID id = UUID.randomUUID();
        mvc.perform(delete("/api/job-titles/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        verify(labelService).delete(id);
    }

    @Test
    void create_delegates() throws Exception {
        when(labelService.create(any())).thenReturn(
                LabelDto.builder().id(UUID.randomUUID()).labelFr("Ingenieur").build());

        mvc.perform(post("/api/job-titles")
                        .contentType("application/json")
                        .content("{\"labelFr\":\"Ingenieur\",\"labelEn\":\"Engineer\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.labelFr").value("Ingenieur"));
    }

    @Test
    void update_delegates() throws Exception {
        UUID id = UUID.randomUUID();
        when(labelService.update(eq(id), any())).thenReturn(
                LabelDto.builder().id(id).labelFr("new").build());

        mvc.perform(put("/api/job-titles/" + id)
                        .contentType("application/json")
                        .content("{\"labelFr\":\"new\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.labelFr").value("new"));
    }

    @Test
    void bulkDelete_returnsCount() throws Exception {
        when(labelService.bulkDelete(any())).thenReturn(2);

        mvc.perform(post("/api/job-titles/bulk-delete")
                        .contentType("application/json")
                        .content("{\"ids\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(2));
    }
}
