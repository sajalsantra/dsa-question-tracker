package com.dsatracker.backend.repository;

import com.dsatracker.backend.entity.ActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ActivityRepository extends JpaRepository<ActivityEntity, String> {
    List<ActivityEntity> findByUserId(String userId);
    Optional<ActivityEntity> findByUserIdAndActivityDate(String userId, String activityDate);
    void deleteByUserId(String userId);
}
