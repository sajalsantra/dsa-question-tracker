package com.dsatracker.backend.controller;

import com.dsatracker.backend.dto.AiChatRequest;
import com.dsatracker.backend.dto.AiChatResponse;
import com.dsatracker.backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dsatracker.backend.entity.UserAiChatEntity;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chatWithAi(@RequestBody AiChatRequest request) {
        AiChatResponse response = aiService.generateHintOrAnswer(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{questionId}")
    public ResponseEntity<List<UserAiChatEntity>> getHistory(
            @RequestHeader(value = "X-User-Id", defaultValue = "guest") String userId,
            @PathVariable String questionId) {
        List<UserAiChatEntity> history = aiService.getChatHistory(userId, questionId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/history/{questionId}")
    public ResponseEntity<List<UserAiChatEntity>> saveHistory(
            @RequestHeader(value = "X-User-Id", defaultValue = "guest") String userId,
            @PathVariable String questionId,
            @RequestBody List<UserAiChatEntity> messages) {
        List<UserAiChatEntity> saved = aiService.saveChatHistory(userId, questionId, messages);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/history/{questionId}")
    public ResponseEntity<Void> deleteHistory(
            @RequestHeader(value = "X-User-Id", defaultValue = "guest") String userId,
            @PathVariable String questionId) {
        aiService.deleteChatHistory(userId, questionId);
        return ResponseEntity.ok().build();
    }
}
