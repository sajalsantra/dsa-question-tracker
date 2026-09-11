package com.dsatracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "question_notes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "question_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotesEntity {
    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    @Column(name = "note_text", columnDefinition = "TEXT")
    private String noteText;

    @Column(name = "updated_at")
    private String updatedAt;
}
