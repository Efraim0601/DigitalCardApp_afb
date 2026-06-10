package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.LabelCreateRequest;
import com.afriland.cardyo.dto.LabelDto;
import com.afriland.cardyo.dto.PagedResponse;
import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.service.LabelService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DepartmentControllerTest {

    @Mock private LabelService<Department> labelService;
    private MockMvc mvc;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new DepartmentController(labelService)).build();
    }

    @Test
    void list_returnsPagedResponse() throws Exception {
        when(labelService.findAll(anyInt(), anyInt(), any()))
                .thenReturn(PagedResponse.<LabelDto>builder()
                        .items(List.of()).total(0).limit(20).offset(0).build());

        mvc.perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void create_invokesService() throws Exception {
        LabelCreateRequest req = new LabelCreateRequest();
        req.setLabelFr("IT");
        req.setLabelEn("IT");

        when(labelService.create(any())).thenReturn(
                LabelDto.builder().id(UUID.randomUUID()).labelFr("IT").labelEn("IT").build());

        mvc.perform(post("/api/departments")
                        .contentType("application/json")
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.labelFr").value("IT"));
    }

    @Test
    void update_invokesService() throws Exception {
        UUID id = UUID.randomUUID();
        when(labelService.update(eq(id), any())).thenReturn(
                LabelDto.builder().id(id).labelFr("new").build());

        mvc.perform(put("/api/departments/" + id)
                        .contentType("application/json")
                        .content("{\"labelFr\":\"new\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.labelFr").value("new"));
    }

    @Test
    void delete_returnsSuccess() throws Exception {
        UUID id = UUID.randomUUID();
        mvc.perform(delete("/api/departments/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        verify(labelService).delete(id);
    }

    @Test
    void bulkDelete_returnsCount() throws Exception {
        when(labelService.bulkDelete(any())).thenReturn(3);

        mvc.perform(post("/api/departments/bulk-delete")
                        .contentType("application/json")
                        .content("{\"ids\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(3));
    }
}
