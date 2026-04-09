package com.afriland.cardyo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Admin admin = new Admin();
    private Cors cors = new Cors();
    private Card card = new Card();

    @Data
    public static class Admin {
        private String email;
        private String password;
        private String sessionSecret;
    }

    @Data
    public static class Cors {
        private String allowedOrigins;
    }

    @Data
    public static class Card {
        private String fixedPhone;
        private String fixedFax;
    }
}
