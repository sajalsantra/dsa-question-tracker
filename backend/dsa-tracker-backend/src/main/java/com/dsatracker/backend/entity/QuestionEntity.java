package com.dsatracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionEntity {
    @Id
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private String difficulty;

    private Integer stars;

    @Column(name = "leet_code_url", columnDefinition = "TEXT")
    private String leetCodeUrl;

    @Column(name = "solution_url", columnDefinition = "TEXT")
    private String solutionUrl;

    @Column(columnDefinition = "TEXT")
    private String tags;

    private String category;
}
