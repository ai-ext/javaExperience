package com.example.debuglab;

import java.sql.SQLException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class DebugLabApplication {
    public static void main(String[] args) {
        SpringApplication.run(DebugLabApplication.class, args);
    }
}

@RestController
class OrderController {
    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    @GetMapping("/orders/{id}")
    Map<String, Object> find(@PathVariable long id) {
        log.info("order lookup id={}", id);
        if (id == 13) {
            throw new IllegalStateException(
                    "order lookup failed",
                    new SQLException("simulated database timeout"));
        }
        return Map.of("id", id, "status", "OK");
    }
}
