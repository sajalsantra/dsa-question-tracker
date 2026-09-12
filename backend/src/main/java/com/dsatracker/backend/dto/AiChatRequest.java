package com.dsatracker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {
    private String questionTitle;
    private String topic;
    private String pattern;
    private Integer stars;
    private String notesText;
    private String userPrompt;
    private String actionType; // HINT, APPROACH, COMPLEXITY, CODE_REVIEW, CUSTOM
    private String apiKey;     // Optional client override key
}
