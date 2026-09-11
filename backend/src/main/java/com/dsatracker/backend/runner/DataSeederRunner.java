package com.dsatracker.backend.runner;

import com.dsatracker.backend.entity.QuestionEntity;
import com.dsatracker.backend.repository.QuestionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeederRunner implements CommandLineRunner {

    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        if (questionRepository.count() == 0) {
            log.info("Seeding DSA Questions into MySQL database...");
            ClassPathResource resource = new ClassPathResource("questions.json");
            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream()) {
                    List<Map<String, Object>> rawQuestions = objectMapper.readValue(
                            inputStream, new TypeReference<List<Map<String, Object>>>() {}
                    );

                    for (Map<String, Object> q : rawQuestions) {
                        Integer id = ((Number) q.get("id")).intValue();
                        String title = (String) q.get("title");
                        String topic = (String) q.get("topic");
                        String difficulty = (String) q.get("difficulty");
                        Integer stars = q.containsKey("stars") ? ((Number) q.get("stars")).intValue() : 1;
                        String leetCodeUrl = (String) q.get("leetCodeUrl");
                        String solutionUrl = (String) q.get("solutionUrl");

                        Object tagsObj = q.get("tags");
                        String tags = tagsObj != null ? objectMapper.writeValueAsString(tagsObj) : "[]";
                        String category = (String) q.get("category");

                        QuestionEntity entity = QuestionEntity.builder()
                                .id(id)
                                .title(title)
                                .topic(topic)
                                .difficulty(difficulty)
                                .stars(stars)
                                .leetCodeUrl(leetCodeUrl)
                                .solutionUrl(solutionUrl)
                                .tags(tags)
                                .category(category)
                                .build();

                        questionRepository.save(entity);
                    }
                    log.info("Successfully seeded {} questions into MySQL questions table!", rawQuestions.size());
                }
            } else {
                log.warn("questions.json not found on classpath, skipping initial seed.");
            }
        } else {
            log.info("MySQL questions table already contains {} records.", questionRepository.count());
        }
    }
}
