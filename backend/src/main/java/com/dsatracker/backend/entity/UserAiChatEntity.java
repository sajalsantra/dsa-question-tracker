package com.dsatracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_ai_chat", indexes = {
    @Index(name = "idx_user_question", columnList = "user_id, question_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAiChatEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "question_id", nullable = false)
    private String questionId;

    @Column(nullable = false)
    private String sender; // "user" or "ai"

    @Column(name = "message_text", columnDefinition = "TEXT", nullable = false)
    private String messageText;

    @Column(name = "timestamp")
    private String timestamp;

    @Column(name = "created_at")
    private String createdAt;
}
