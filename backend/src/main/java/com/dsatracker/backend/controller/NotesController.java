package com.dsatracker.backend.controller;

import com.dsatracker.backend.entity.NotesEntity;
import com.dsatracker.backend.repository.NotesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NotesController {

    private final NotesRepository notesRepository;

    @GetMapping
    public ResponseEntity<Map<Integer, String>> getNotes(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        List<NotesEntity> list = notesRepository.findByUserId(userId);

        Map<Integer, String> map = new HashMap<>();
        for (NotesEntity n : list) {
            map.put(n.getQuestionId(), n.getNoteText());
        }
        return ResponseEntity.ok(map);
    }

    @PostMapping("/{questionId}")
    public ResponseEntity<Void> saveNote(@PathVariable Integer questionId,
                                         @RequestBody Map<String, String> body,
                                         Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String id = userId + "_" + questionId;
        String noteText = body.getOrDefault("notes", body.getOrDefault("noteText", ""));

        NotesEntity entity = NotesEntity.builder()
                .id(id)
                .userId(userId)
                .questionId(questionId)
                .noteText(noteText)
                .updatedAt(java.time.Instant.now().toString())
                .build();

        notesRepository.save(entity);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<Integer, String>> syncNotes(@RequestBody Map<Integer, String> notesMap,
                                                          Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        if (notesMap != null && !notesMap.isEmpty()) {
            for (Map.Entry<Integer, String> entry : notesMap.entrySet()) {
                Integer questionId = entry.getKey();
                String noteText = entry.getValue();
                NotesEntity entity = NotesEntity.builder()
                        .id(userId + "_" + questionId)
                        .userId(userId)
                        .questionId(questionId)
                        .noteText(noteText != null ? noteText : "")
                        .updatedAt(java.time.Instant.now().toString())
                        .build();
                notesRepository.save(entity);
            }
        }
        return getNotes(authentication);
    }

    @DeleteMapping("/{questionId}")
    @Transactional
    public ResponseEntity<Void> deleteNote(@PathVariable Integer questionId,
                                           Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        notesRepository.deleteByUserIdAndQuestionId(userId, questionId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/reset")
    @Transactional
    public ResponseEntity<Void> resetNotes(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        notesRepository.deleteByUserId(userId);
        return ResponseEntity.ok().build();
    }
}
