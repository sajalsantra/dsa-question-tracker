package com.dsatracker.backend.service;

import com.dsatracker.backend.dto.AiChatRequest;
import com.dsatracker.backend.dto.AiChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.dsatracker.backend.entity.UserAiChatEntity;
import com.dsatracker.backend.repository.UserAiChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiService {

    @Value("${app.gemini.api-key:}")
    private String configuredApiKey;

    private final UserAiChatRepository userAiChatRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public List<UserAiChatEntity> saveChatHistory(String userId, String questionId, List<UserAiChatEntity> messages) {
        if (userId == null || userId.trim().isEmpty() || questionId == null) {
            return List.of();
        }
        userAiChatRepository.deleteByUserIdAndQuestionId(userId, questionId);
        if (messages != null && !messages.isEmpty()) {
            for (UserAiChatEntity msg : messages) {
                msg.setUserId(userId);
                msg.setQuestionId(questionId);
            }
            return userAiChatRepository.saveAll(messages);
        }
        return List.of();
    }

    public List<UserAiChatEntity> getChatHistory(String userId, String questionId) {
        if (userId == null || questionId == null) return List.of();
        return userAiChatRepository.findByUserIdAndQuestionIdOrderByIdAsc(userId, questionId);
    }

    @Transactional
    public void deleteChatHistory(String userId, String questionId) {
        if (userId == null || questionId == null) return;
        userAiChatRepository.deleteByUserIdAndQuestionId(userId, questionId);
    }

    public AiChatResponse generateHintOrAnswer(AiChatRequest request) {
        String apiKey = (request.getApiKey() != null && !request.getApiKey().trim().isEmpty())
                ? request.getApiKey().trim()
                : configuredApiKey;

        if (apiKey == null || apiKey.trim().isEmpty()) {
            return AiChatResponse.builder()
                    .success(false)
                    .responseText("AI API Key is missing. Please configure your OpenAI or Gemini API Key in Settings.")
                    .errorMessage("API Key missing")
                    .actionType(request.getActionType())
                    .build();
        }

        if (apiKey.startsWith("sk-")) {
            return callOpenAi(request, apiKey);
        } else {
            return callGemini(request, apiKey);
        }
    }

    private AiChatResponse callOpenAi(AiChatRequest request, String apiKey) {
        try {
            String systemInstruction = buildSystemPrompt(request);
            String userMessage = buildUserPrompt(request);

            String url = "https://api.openai.com/v1/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", systemInstruction),
                    Map.of("role", "user", "content", userMessage)
            ));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String extractedText = parseOpenAiResponse(response.getBody());
                return AiChatResponse.builder()
                        .success(true)
                        .responseText(extractedText)
                        .actionType(request.getActionType())
                        .build();
            } else {
                return AiChatResponse.builder()
                        .success(false)
                        .responseText("Failed to get response from OpenAI service.")
                        .errorMessage("API HTTP status: " + response.getStatusCode())
                        .actionType(request.getActionType())
                        .build();
            }
        } catch (Exception e) {
            log.error("Error generating OpenAI response", e);
            return AiChatResponse.builder()
                    .success(false)
                    .responseText("Unable to connect to OpenAI service: " + e.getMessage())
                    .errorMessage(e.getMessage())
                    .actionType(request.getActionType())
                    .build();
        }
    }

    private AiChatResponse callGemini(AiChatRequest request, String apiKey) {
        try {
            String systemInstruction = buildSystemPrompt(request);
            String userMessage = buildUserPrompt(request);

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-goog-api-key", apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> userContent = new HashMap<>();
            userContent.put("role", "user");
            
            Map<String, Object> userTextPart = new HashMap<>();
            userTextPart.put("text", systemInstruction + "\n\nStudent Prompt: " + userMessage);
            userContent.put("parts", List.of(userTextPart));

            requestBody.put("contents", List.of(userContent));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String extractedText = parseGeminiResponse(response.getBody());
                return AiChatResponse.builder()
                        .success(true)
                        .responseText(extractedText)
                        .actionType(request.getActionType())
                        .build();
            } else {
                return AiChatResponse.builder()
                        .success(false)
                        .responseText("Failed to get response from Gemini service.")
                        .errorMessage("API HTTP status: " + response.getStatusCode())
                        .actionType(request.getActionType())
                        .build();
            }
        } catch (Exception e) {
            log.error("Error generating Gemini response", e);
            return AiChatResponse.builder()
                    .success(false)
                    .responseText("Unable to connect to Gemini service: " + e.getMessage())
                    .errorMessage(e.getMessage())
                    .actionType(request.getActionType())
                    .build();
        }
    }

    private String buildSystemPrompt(AiChatRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are Beru, an expert, encouraging, and clear Data Structures & Algorithms (DSA) Socratic Mentor.\n");
        sb.append("Adopt ChatGPT's signature response style: structured, clear, direct, visually engaging, and well-formatted markdown.\n");
        sb.append("Current Problem Context:\n");
        if (req.getQuestionTitle() != null) sb.append("- Title: ").append(req.getQuestionTitle()).append("\n");
        if (req.getTopic() != null) sb.append("- Topic: ").append(req.getTopic()).append("\n");
        if (req.getPattern() != null) sb.append("- Pattern: ").append(req.getPattern()).append("\n");
        if (req.getStars() != null) sb.append("- Difficulty: ").append(req.getStars()).append(" Stars\n");
        if (req.getNotesText() != null && !req.getNotesText().trim().isEmpty()) {
            sb.append("- Student's Notes/Code:\n```\n").append(req.getNotesText()).append("\n```\n");
        }
        sb.append("\nInstructions for ChatGPT Writing Style:\n");
        sb.append("1. **Clear Structure**: Organize your response into logical sections with clear markdown headings (e.g., `### 💡 Intuition`, `### 🧠 Step-by-Step Approach`, `### ⏱️ Complexity Analysis`).\n");
        sb.append("2. **Engaging & Direct**: Be friendly, conversational, and direct. Skip unnecessary filler meta-intros or repetitive intro lines.\n");
        sb.append("3. **Visual Markdown**: Highlight key technical terms in **bold**, use inline `code` for variables/functions, and use formatted code blocks (```python / cpp / java / js```) when showing code.\n");
        sb.append("4. **Socratic Intuition**: Provide intuitive explanations and progressive hints first. Do NOT dump full solution code immediately unless specifically asked.\n");
        sb.append("5. **Language Preference**: If asked for full solution code and no language is specified (and no code is in student notes), ask which language they prefer (e.g., C++, Java, Python, JavaScript, Go) before generating full code.\n");
        sb.append("6. **Clean Math & Complexity**: Format Big-O notation as `O(N)` or `O(N log N)`. Do NOT use \\text{} or raw LaTeX macros in math expressions. Use plain readable text or inline `code` instead.\n");
        return sb.toString();
    }

    private String buildUserPrompt(AiChatRequest req) {
        if (req.getActionType() != null) {
            switch (req.getActionType().toUpperCase()) {
                case "HINT":
                    return "Give me a small conceptual hint (Hint 1) to point me in the right direction without revealing the algorithm.";
                case "APPROACH":
                    return "Explain the optimal approach and step-by-step algorithm intuition for this problem.";
                case "COMPLEXITY":
                    return "What is the target Time and Space complexity for this problem, and why?";
                case "CODE_REVIEW":
                    return "Review the code/notes I wrote for this problem. Point out any logic bugs, edge case vulnerabilities, or optimizations.";
                default:
                    break;
            }
        }
        return (req.getUserPrompt() != null && !req.getUserPrompt().trim().isEmpty())
                ? req.getUserPrompt().trim()
                : "Give me a helpful hint for this problem.";
    }

    @SuppressWarnings("unchecked")
    private String parseOpenAiResponse(Map responseBody) {
        try {
            List choices = (List) responseBody.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map firstChoice = (Map) choices.get(0);
                Map message = (Map) firstChoice.get("message");
                if (message != null) {
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse OpenAI API response structure", e);
        }
        return "Received empty response from OpenAI model.";
    }

    @SuppressWarnings("unchecked")
    private String parseGeminiResponse(Map responseBody) {
        try {
            List candidates = (List) responseBody.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map candidate = (Map) candidates.get(0);
                Map content = (Map) candidate.get("content");
                if (content != null) {
                    List parts = (List) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        Map part = (Map) parts.get(0);
                        return (String) part.get("text");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Gemini API response structure", e);
        }
        return "Received empty response from AI model.";
    }
}
