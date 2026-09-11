package com.dsatracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "daily_goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalEntity {
    @Id
    @Column(name = "user_id")
    private String userId;

    private Integer target;

    @Column(name = "last_updated")
    private String lastUpdated;
}
