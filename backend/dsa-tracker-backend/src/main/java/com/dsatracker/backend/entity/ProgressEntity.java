package com.dsatracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "question_progress", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "question_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressEntity {
    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    private String status;
    private Integer confidence;
    private Integer attempts;
    private Integer timeTaken;
    
    @Column(name = "last_solved")
    private String lastSolved;
    
    private Boolean revision;
    private Boolean favorite;
    
    @Column(name = "updated_at")
    private String updatedAt;
}
