package com.dsatracker.backend.repository;

import com.dsatracker.backend.entity.NotesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotesRepository extends JpaRepository<NotesEntity, String> {
    List<NotesEntity> findByUserId(String userId);
    Optional<NotesEntity> findByUserIdAndQuestionId(String userId, Integer questionId);
    void deleteByUserIdAndQuestionId(String userId, Integer questionId);
    void deleteByUserId(String userId);
}
