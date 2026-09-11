package com.dsatracker.backend.repository;

import com.dsatracker.backend.entity.GoalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<GoalEntity, String> {
    Optional<GoalEntity> findByUserId(String userId);
}
