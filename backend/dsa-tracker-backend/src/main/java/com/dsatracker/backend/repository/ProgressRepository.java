package com.dsatracker.backend.repository;

import com.dsatracker.backend.entity.ProgressEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends JpaRepository<ProgressEntity, String> {
    List<ProgressEntity> findByUserId(String userId);
    Optional<ProgressEntity> findByUserIdAndQuestionId(String userId, Integer questionId);
    void deleteByUserIdAndQuestionId(String userId, Integer questionId);
    void deleteByUserId(String userId);
}
