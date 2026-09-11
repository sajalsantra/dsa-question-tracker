package com.dsatracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettingsEntity {
    @Id
    @Column(name = "user_id")
    private String userId;

    private String theme;

    @Column(name = "confidence_threshold")
    private Integer confidenceThreshold;

    @Column(name = "revision_reminder")
    private Boolean revisionReminder;
}
