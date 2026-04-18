package com.afriland.cardyo.controller;

import com.afriland.cardyo.dto.CardCreateRequest;
import com.afriland.cardyo.dto.CardDto;
import com.afriland.cardyo.dto.PagedResponse;
import com.afriland.cardyo.service.CardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
class CardControllerTest {

    @Mock private CardService cardService;
    @InjectMocks private CardController controller;

    private MockMvc mvc;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getCards_byEmailIsPublic() throws Exception {
        when(cardService.findByEmail("john@example.com"))
                .thenReturn(CardDto.builder().email("john@example.com").build());

        mvc.perform(get("/api/cards").param("email", "john@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    @Test
    void getCards_withoutAuthReturns401() throws Exception {
        mvc.perform(get("/api/cards"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getCards_withAuthReturnsList() throws Exception {
        when(cardService.findAll(anyInt(), anyInt(), any()))
                .thenReturn(PagedResponse.<CardDto>builder()
                        .items(List.of()).total(0).limit(20).offset(0).build());

        mvc.perform(get("/api/cards")
                        .principal(new UsernamePasswordAuthenticationToken("admin", null, List.of())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void createCard_delegatesToService() throws Exception {
        CardCreateRequest req = new CardCreateRequest();
        req.setEmail("new@example.com");

        when(cardService.upsert(any(CardCreateRequest.class)))
                .thenReturn(CardDto.builder().email("new@example.com").build());

        mvc.perform(post("/api/cards")
                        .contentType("application/json")
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("new@example.com"));
    }

    @Test
    void deleteCard_returnsSuccess() throws Exception {
        UUID id = UUID.randomUUID();
        mvc.perform(delete("/api/cards/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cardService).delete(id);
    }

    @Test
    void updateCard_delegatesToService() throws Exception {
        UUID id = UUID.randomUUID();
        when(cardService.update(eq(id), any()))
                .thenReturn(CardDto.builder().email("updated@example.com").build());

        mvc.perform(put("/api/cards/" + id)
                        .contentType("application/json")
                        .content("{\"firstName\":\"Jane\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("updated@example.com"));
    }

    @Test
    void incrementShareCount_invokesService() throws Exception {
        mvc.perform(post("/api/cards/increment-share/john@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cardService).incrementShareCount("john@example.com");
    }
}
