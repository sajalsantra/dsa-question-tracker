package com.dsatracker.backend.controller;

import com.dsatracker.backend.entity.ActivityEntity;
import com.dsatracker.backend.entity.GoalEntity;
import com.dsatracker.backend.repository.ActivityRepository;
import com.dsatracker.backend.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityRepository activityRepository;
    private final GoalRepository goalRepository;

    @GetMapping
    public ResponseEntity<Map<String, Integer>> getActivity(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        List<ActivityEntity> list = activityRepository.findByUserId(userId);

        Map<String, Integer> map = new HashMap<>();
        for (ActivityEntity a : list) {
            map.put(a.getActivityDate(), a.getCount());
        }
        return ResponseEntity.ok(map);
    }

    @PostMapping
    public ResponseEntity<Void> saveActivity(@RequestBody Map<String, Object> body,
                                             Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String date = (String) body.get("date");
        Integer count = ((Number) body.get("count")).intValue();

        String id = userId + "_" + date;
        ActivityEntity entity = ActivityEntity.builder()
                .id(id)
                .userId(userId)
                .activityDate(date)
                .count(count)
                .build();

        activityRepository.save(entity);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/reset")
    @Transactional
    public ResponseEntity<Void> resetActivity(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        activityRepository.deleteByUserId(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/goal")
    public ResponseEntity<GoalEntity> getDailyGoal(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        GoalEntity goal = goalRepository.findByUserId(userId)
                .orElse(GoalEntity.builder().userId(userId).target(3).lastUpdated(java.time.Instant.now().toString()).build());
        return ResponseEntity.ok(goal);
    }

    @PostMapping("/goal")
    public ResponseEntity<GoalEntity> saveDailyGoal(@RequestBody GoalEntity goal,
                                                     Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        goal.setUserId(userId);
        goal.setLastUpdated(java.time.Instant.now().toString());
        GoalEntity saved = goalRepository.save(goal);
        return ResponseEntity.ok(saved);
    }
}
