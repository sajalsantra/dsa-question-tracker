package com.dsatracker.backend.controller;

import com.dsatracker.backend.entity.ProgressEntity;
import com.dsatracker.backend.repository.ProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressRepository progressRepository;

    @GetMapping
    public ResponseEntity<Map<Integer, ProgressEntity>> getProgress(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        List<ProgressEntity> list = progressRepository.findByUserId(userId);

        Map<Integer, ProgressEntity> map = new HashMap<>();
        for (ProgressEntity p : list) {
            map.put(p.getQuestionId(), p);
        }
        return ResponseEntity.ok(map);
    }

    @PostMapping("/{questionId}")
    public ResponseEntity<ProgressEntity> saveProgress(@PathVariable Integer questionId,
                                                        @RequestBody ProgressEntity progress,
                                                        Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String id = userId + "_" + questionId;

        progress.setId(id);
        progress.setUserId(userId);
        progress.setQuestionId(questionId);

        ProgressEntity saved = progressRepository.save(progress);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{questionId}")
    @Transactional
    public ResponseEntity<Void> deleteProgress(@PathVariable Integer questionId,
                                               Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        progressRepository.deleteByUserIdAndQuestionId(userId, questionId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/reset")
    @Transactional
    public ResponseEntity<Void> resetProgress(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        progressRepository.deleteByUserId(userId);
        return ResponseEntity.ok().build();
    }
}
