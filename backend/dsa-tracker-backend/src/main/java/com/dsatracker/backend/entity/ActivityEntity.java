package com.dsatracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "activity_logs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "activity_date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityEntity {
    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "activity_date", nullable = false)
    private String activityDate;

    private Integer count;
}
