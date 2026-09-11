package com.dsatracker.backend.controller;

import com.dsatracker.backend.entity.QuestionEntity;
import com.dsatracker.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionRepository questionRepository;

    @GetMapping
    public ResponseEntity<List<QuestionEntity>> getAllQuestions() {
        return ResponseEntity.ok(questionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionEntity> getQuestionById(@PathVariable Integer id) {
        return questionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
