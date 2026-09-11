package com.dsatracker.backend.controller;

import com.dsatracker.backend.entity.SettingsEntity;
import com.dsatracker.backend.repository.SettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsRepository settingsRepository;

    @GetMapping
    public ResponseEntity<SettingsEntity> getSettings(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        SettingsEntity settings = settingsRepository.findByUserId(userId)
                .orElse(SettingsEntity.builder()
                        .userId(userId)
                        .theme("dark")
                        .confidenceThreshold(70)
                        .revisionReminder(true)
                        .build());
        return ResponseEntity.ok(settings);
    }

    @PostMapping
    public ResponseEntity<SettingsEntity> saveSettings(@RequestBody SettingsEntity settings,
                                                        Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        settings.setUserId(userId);
        SettingsEntity saved = settingsRepository.save(settings);
        return ResponseEntity.ok(saved);
    }
}
