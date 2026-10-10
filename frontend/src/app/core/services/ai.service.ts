import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { SettingsService } from './settings.service';
import { DEFAULT_SETTINGS } from '../models/settings.model';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

export interface AiPromptRequest {
  questionTitle: string;
  topic: string;
  pattern?: string;
  stars: number;
  notesText?: string;
  userPrompt?: string;
  actionType: 'HINT' | 'APPROACH' | 'COMPLEXITY' | 'CODE_REVIEW' | 'CUSTOM';
}

export interface AiPromptResponse {
  responseText: string;
  actionType: string;
  success: boolean;
  errorMessage?: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly firebaseService = inject(FirebaseService);

  saveChatToCloud(questionId: string | number, messages: ChatMessage[]): void {
    if (this.settingsService.settings().enableCloudSync === false) {
      return;
    }
    const qIdStr = String(questionId);

    // Cloud Firestore Sync
    const user = this.authService.currentUser();
    if (user && user.id) {
      try {
        const docRef = doc(
          this.firebaseService.db,
          `users/${user.id}/ai_chat_history/${qIdStr}`,
        );
        setDoc(
          docRef,
          {
            questionId: qIdStr,
            messages: messages,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        ).catch((err) => console.warn('Firestore AI Chat Sync Error', err));
      } catch (err) {
        console.warn('Firestore AI Chat Error', err);
      }
    }
  }

  fetchChatFromCloud(questionId: string | number): Observable<ChatMessage[]> {
    if (this.settingsService.settings().enableCloudSync === false) {
      return of([]);
    }
    const qIdStr = String(questionId);

    // Cloud Firestore
    const user = this.authService.currentUser();
    if (user && user.id) {
      const docRef = doc(
        this.firebaseService.db,
        `users/${user.id}/ai_chat_history/${qIdStr}`,
      );
      return new Observable<ChatMessage[]>((observer) => {
        getDoc(docRef)
          .then((snap) => {
            if (snap.exists()) {
              const msgs = snap.data()['messages'] || [];
              observer.next(msgs);
            } else {
              observer.next([]);
            }
            observer.complete();
          })
          .catch(() => {
            observer.next([]);
            observer.complete();
          });
      });
    }

    return of([]);
  }

  deleteChatFromCloud(questionId: string | number): void {
    if (this.settingsService.settings().enableCloudSync === false) {
      return;
    }
    const qIdStr = String(questionId);
    const user = this.authService.currentUser();
    if (user && user.id) {
      try {
        const docRef = doc(
          this.firebaseService.db,
          `users/${user.id}/ai_chat_history/${qIdStr}`,
        );
        deleteDoc(docRef).catch(() => {});
      } catch {}
    }
  }

  askAiMentor(req: AiPromptRequest): Observable<AiPromptResponse> {
    const settings = this.settingsService.settings();
    const provider = settings.aiProvider || 'gemini';
    const rawKey =
      provider === 'openai'
        ? settings.openAiApiKey || DEFAULT_SETTINGS.openAiApiKey
        : settings.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey;
    const userApiKey = rawKey?.trim();

    return this.callDirectAiApi(req, provider, userApiKey);
  }

  private callDirectAiApi(
    req: AiPromptRequest,
    provider: string,
    apiKey?: string,
  ): Observable<AiPromptResponse> {
    if (provider === 'openai' || (apiKey && apiKey.startsWith('sk-'))) {
      return this.callOpenAiDirect(req, apiKey);
    } else {
      return this.callGeminiDirect(req, apiKey);
    }
  }

  private callOpenAiDirect(
    req: AiPromptRequest,
    apiKey?: string,
  ): Observable<AiPromptResponse> {
    if (!apiKey) {
      console.warn(
        '💡 OpenAI API Key Required: Please check your OpenAI API Key in Settings.',
      );
      return of({
        success: false,
        responseText:
          '⚠️ Something went wrong while getting your response. Please try again in a moment!',
        actionType: req.actionType,
        errorMessage: 'Missing OpenAI API Key',
      });
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    const systemPrompt = this.buildSystemPrompt(req);
    const userMessage = this.buildUserPrompt(req);

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    });

    return this.http.post<any>(url, body, { headers }).pipe(
      map((res) => {
        const text =
          res?.choices?.[0]?.message?.content || 'No response generated.';
        return {
          success: true,
          responseText: text,
          actionType: req.actionType,
        };
      }),
      catchError((err) => {
        console.error('Direct OpenAI API Call Error:', err);
        return of({
          success: false,
          responseText:
            '⚠️ Something went wrong while getting your response. Please try again in a moment!',
          actionType: req.actionType,
          errorMessage: err.message,
        });
      }),
    );
  }

  private callGeminiDirect(
    req: AiPromptRequest,
    userApiKey?: string,
  ): Observable<AiPromptResponse> {
    if (!userApiKey || !userApiKey.trim()) {
      console.warn(
        '💡 Google Gemini API Key Required: Please enter your Google Gemini API key in Settings or switch to OpenAI!',
      );
      return of({
        success: false,
        responseText:
          '⚠️ Something went wrong while getting your response. Please try again in a moment!',
        actionType: req.actionType,
        errorMessage: 'Invalid Gemini API Key format',
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(userApiKey || '')}`;
    const systemPrompt = this.buildSystemPrompt(req);
    const userMessage = this.buildUserPrompt(req);

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nStudent Request: ${userMessage}` },
          ],
        },
      ],
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-goog-api-key': userApiKey || '',
    });

    return this.http.post<any>(url, body, { headers }).pipe(
      map((res) => {
        const text =
          res?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'No response generated.';
        return {
          success: true,
          responseText: text,
          actionType: req.actionType,
        };
      }),
      catchError((err) => {
        console.error('Direct Gemini API Call Error:', err);
        return of({
          success: false,
          responseText:
            '⚠️ Something went wrong while getting your response. Please try again in a moment!',
          actionType: req.actionType,
        });
      }),
    );
  }

  private buildSystemPrompt(req: AiPromptRequest): string {
    let prompt = `
You are Beru, an expert DSA mentor. Your responses should feel like a clean, modern, mobile-friendly DSA learning app — direct, concise, and easy to scan.

## Problem Context
- Title: ${req.questionTitle}
- Topic: ${req.topic}
${req.pattern ? `- Pattern: ${req.pattern}\n` : ''}
- Difficulty: ${req.stars} Stars
${
  req.notesText?.trim()
    ? `- Student Notes / Code:
\`\`\`
${req.notesText}
\`\`\`
`
    : ''
}

## Response Formatting & Tone Rules

### 1. Keep It Simple & Direct
- Start directly with the useful explanation. Skip intros like "Here is the Java solution..." or "Let's dive into...".
- Be concise and get to the point immediately.

### 2. Avoid Heading Overload (Max 3–4 Sections)
Use at most 3–4 simple Markdown sections per response.
Prefer clean headings like:
- ### 💡 Idea
- ### 💻 Solution
- ### ⏱️ Complexity

Only add sections like "Dry Run" or "Edge Cases" when genuinely helpful.

### 3. Compact Explanations & Clean Bullets
- Keep paragraphs short and scannable.
- Do not explain the same idea multiple times.
- Use bullets ONLY when they improve readability. Avoid turning every sentence into a bullet.

### 4. Focused Code
- Show clean, focused code without excessive line-by-line comments.
- Only comment on non-obvious logic.

### 5. Visual Dry Run (When Needed)
Keep dry runs visual and compact (e.g. \`3 → min=3\`, \`5 → max=5\`). Do not write long sentences for every step.

### 6. Clean Math Notation & Complexity
- Use clean standard notation for complexity: Time: \`O(N)\`, Space: \`O(1)\`.
- Do NOT use LaTeX \`\\text{...}\` macros or raw LaTeX math commands (e.g. write \`left_sum + current_element = total_sum\` instead of \`\\text{left sum}\`). Use clean, plain readable text or inline code \`code\`.

### 7. Socratic Behavior
- Use Socratic teaching when appropriate (e.g. when the student asks for hints or is stuck).
- If the student asks for the full solution or an optimal approach, answer directly without forcing hints or appending "Food for Thought" / "Can you think of..." questions.

## Final Pre-Response Check
Ensure the response is lightweight, readable, and free of fluff before sending.
`;

    return prompt;
  }

  private buildUserPrompt(req: AiPromptRequest): string {
    switch (req.actionType) {
      case 'HINT':
        return 'Give me a small conceptual hint (Hint 1) to point me in the right direction without revealing the algorithm.';
      case 'APPROACH':
        return 'Explain the optimal approach and step-by-step algorithm intuition for this problem.';
      case 'COMPLEXITY':
        return 'What is the target Time and Space complexity for this problem, and why?';
      case 'CODE_REVIEW':
        return 'Review the code/notes I wrote for this problem. Point out any logic bugs, edge case vulnerabilities, or optimizations.';
      default:
        return req.userPrompt || 'Give me a helpful hint for this problem.';
    }
  }
}
