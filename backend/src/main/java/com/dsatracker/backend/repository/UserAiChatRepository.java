package com.dsatracker.backend.repository;

import com.dsatracker.backend.entity.UserAiChatEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAiChatRepository extends JpaRepository<UserAiChatEntity, Long> {
    List<UserAiChatEntity> findByUserIdAndQuestionIdOrderByIdAsc(String userId, String questionId);
    void deleteByUserIdAndQuestionId(String userId, String questionId);
}
