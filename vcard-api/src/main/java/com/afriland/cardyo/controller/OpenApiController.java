package com.afriland.cardyo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class OpenApiController {

    @GetMapping("/api/openapi")
    public String openApi() {
        return "forward:/v3/api-docs";
    }
}
