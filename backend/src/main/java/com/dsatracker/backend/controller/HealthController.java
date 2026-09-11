package com.dsatracker.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "DSA Question Tracker SpringBoot Backend",
            "database", "MySQL",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
