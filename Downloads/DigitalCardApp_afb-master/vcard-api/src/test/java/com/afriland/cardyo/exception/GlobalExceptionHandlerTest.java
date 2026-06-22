package com.afriland.cardyo.exception;

import com.afriland.cardyo.dto.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotFound_returns404() {
        ResponseEntity<ErrorResponse> res = handler.handleNotFound(
                new EntityNotFoundException("Card missing"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody().getError()).isEqualTo("Card missing");
    }

    @Test
    void handleBadRequest_returns400() {
        ResponseEntity<ErrorResponse> res = handler.handleBadRequest(
                new IllegalArgumentException("bad"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody().getError()).isEqualTo("bad");
    }

    @Test
    void handleUnauthorized_returns401() {
        ResponseEntity<ErrorResponse> res = handler.handleUnauthorized(
                new SecurityException("denied"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(res.getBody().getError()).isEqualTo("denied");
    }

    @Test
    void handleValidation_aggregatesFieldErrors() throws Exception {
        Method method = Sample.class.getDeclaredMethod("stub", Form.class);
        MethodParameter parameter = new MethodParameter(method, 0);
        BindingResult binding = new BeanPropertyBindingResult(new Form(), "form");
        binding.rejectValue("email", "Email", "must not be blank");
        binding.rejectValue("firstName", "NotNull", "is required");
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, binding);

        ResponseEntity<ErrorResponse> res = handler.handleValidation(ex);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody().getError())
                .contains("email: must not be blank")
                .contains("firstName: is required");
    }

    @Test
    void handleMaxUpload_returns413() {
        ResponseEntity<ErrorResponse> res = handler.handleMaxUpload(
                new MaxUploadSizeExceededException(1024));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(res.getBody().getError()).contains("File too large");
    }

    @Test
    void handleGeneric_returns500() {
        ResponseEntity<ErrorResponse> res = handler.handleGeneric(new RuntimeException("boom"));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(res.getBody().getError()).isEqualTo("Internal server error");
    }

    @SuppressWarnings("unused")
    private static class Sample {
        void stub(Form form) {
            // Reflection-only stub used by MethodParameter; no runtime execution expected.
        }
    }

    @SuppressWarnings("unused")
    private static class Form {
        private String email;
        private String firstName;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
    }
}
