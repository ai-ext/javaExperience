package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class ProbeApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProbeApplication.class, args);
    }
}

@RestController
class ProbeController {
    @GetMapping("/probe")
    String probe() { return "ok"; }
}
