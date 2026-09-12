import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { ApiHealthService } from './api-health.service';
import { SettingsService } from './settings.service';
import { DEFAULT_SETTINGS } from '../models/settings.model';
import { environment } from '../../../environments/environment';

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
  private readonly healthService = inject(ApiHealthService);
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly firebaseService = inject(FirebaseService);

  saveChatToCloud(questionId: string | number, messages: ChatMessage[]): void {
    const qIdStr = String(questionId);

    // 1. Spring Boot MySQL Backend API Sync
    if (this.healthService.isSpringBootOnline()) {
      const backendUrl = `${environment.apiUrl}/ai/history/${qIdStr}`;
      const payload = messages.map(m => ({
        questionId: qIdStr,
        sender: m.sender,
        messageText: m.text,
        timestamp: m.timestamp
      }));
      this.http.post(backendUrl, payload).pipe(catchError(() => of(null))).subscribe();
    }

    // 2. Cloud Firestore Sync
    const user = this.authService.currentUser();
    if (user && user.id) {
      try {
        const docRef = doc(this.firebaseService.db, `users/${user.id}/ai_chat_history/${qIdStr}`);
        setDoc(docRef, {
          questionId: qIdStr,
          messages: messages,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.warn('Firestore AI Chat Sync Error', err));
      } catch (err) {
        console.warn('Firestore AI Chat Error', err);
      }
    }
  }

  fetchChatFromCloud(questionId: string | number): Observable<ChatMessage[]> {
    const qIdStr = String(questionId);

    // 1. Primary: Spring Boot Backend API
    if (this.healthService.isSpringBootOnline()) {
      const backendUrl = `${environment.apiUrl}/ai/history/${qIdStr}`;
      return this.http.get<any[]>(backendUrl).pipe(
        map(list => {
          if (Array.isArray(list) && list.length > 0) {
            return list.map(item => ({
              sender: item.sender as 'user' | 'ai',
              text: item.messageText,
              timestamp: item.timestamp
            }));
          }
          return [];
        }),
        catchError(() => of([]))
      );
    }

    // 2. Fallback: Cloud Firestore
    const user = this.authService.currentUser();
    if (user && user.id) {
      const docRef = doc(this.firebaseService.db, `users/${user.id}/ai_chat_history/${qIdStr}`);
      return new Observable<ChatMessage[]>(observer => {
        getDoc(docRef).then(snap => {
          if (snap.exists()) {
            const msgs = snap.data()['messages'] || [];
            observer.next(msgs);
          } else {
            observer.next([]);
          }
          observer.complete();
        }).catch(() => {
          observer.next([]);
          observer.complete();
        });
      });
    }

    return of([]);
  }

  deleteChatFromCloud(questionId: string | number): void {
    const qIdStr = String(questionId);
    if (this.healthService.isSpringBootOnline()) {
      const backendUrl = `${environment.apiUrl}/ai/history/${qIdStr}`;
      this.http.delete(backendUrl).pipe(catchError(() => of(null))).subscribe();
    }

    const user = this.authService.currentUser();
    if (user && user.id) {
      try {
        const docRef = doc(this.firebaseService.db, `users/${user.id}/ai_chat_history/${qIdStr}`);
        deleteDoc(docRef).catch(() => {});
      } catch {}
    }
  }

  askAiMentor(req: AiPromptRequest): Observable<AiPromptResponse> {
    const settings = this.settingsService.settings();
    const provider = settings.aiProvider || 'gemini';
    const rawKey = provider === 'openai' 
      ? (settings.openAiApiKey || DEFAULT_SETTINGS.openAiApiKey) 
      : (settings.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey);
    const userApiKey = rawKey?.trim();

    // Pathway 1: Spring Boot Backend
    if (this.healthService.isSpringBootOnline()) {
      const backendUrl = `${environment.apiUrl}/ai/chat`;
      return this.http.post<AiPromptResponse>(backendUrl, {
        ...req,
        apiKey: userApiKey,
        provider: provider
      }).pipe(
        catchError(err => {
          console.warn('Spring Boot AI request failed, falling back to direct client call', err);
          return this.callDirectAiApi(req, provider, userApiKey);
        })
      );
    }

    // Pathway 2: Direct Client Call (Firestore / Offline Mode)
    return this.callDirectAiApi(req, provider, userApiKey);
  }

  private callDirectAiApi(req: AiPromptRequest, provider: string, apiKey?: string): Observable<AiPromptResponse> {
    if (provider === 'openai' || (apiKey && apiKey.startsWith('sk-'))) {
      return this.callOpenAiDirect(req, apiKey);
    } else {
      return this.callGeminiDirect(req, apiKey);
    }
  }

  private callOpenAiDirect(req: AiPromptRequest, apiKey?: string): Observable<AiPromptResponse> {
    if (!apiKey) {
      return of({
        success: false,
        responseText: '💡 **OpenAI API Key Required**\n\nPlease check your OpenAI API Key in **Settings**.',
        actionType: req.actionType,
        errorMessage: 'Missing OpenAI API Key'
      });
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    const systemPrompt = this.buildSystemPrompt(req);
    const userMessage = this.buildUserPrompt(req);

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    });

    return this.http.post<any>(url, body, { headers }).pipe(
      map(res => {
        const text = res?.choices?.[0]?.message?.content || 'No response generated.';
        return {
          success: true,
          responseText: text,
          actionType: req.actionType
        };
      }),
      catchError(err => {
        console.error('Direct OpenAI API Call Error:', err);
        return of({
          success: false,
          responseText: `⚠️ Failed to connect to OpenAI API. Error: ${err?.error?.error?.message || err.message || 'Invalid API Key or Network Issue'}`,
          actionType: req.actionType,
          errorMessage: err.message
        });
      })
    );
  }

  private callGeminiDirect(req: AiPromptRequest, userApiKey?: string): Observable<AiPromptResponse> {
    if (!userApiKey || userApiKey.startsWith('gen-lang-client')) {
      return of({
        success: false,
        responseText: '💡 **Google Gemini API Key Required**\n\nPlease enter your Google Gemini API key in **Settings** or switch to **OpenAI**!',
        actionType: req.actionType,
        errorMessage: 'Invalid Gemini API Key format'
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
    const systemPrompt = this.buildSystemPrompt(req);
    const userMessage = this.buildUserPrompt(req);

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nStudent Request: ${userMessage}` }]
        }
      ]
    };

    const headers = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'X-goog-api-key': userApiKey || ''
    });

    return this.http.post<any>(url, body, { headers }).pipe(
      map(res => {
        const text = res?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        return {
          success: true,
          responseText: text,
          actionType: req.actionType
        };
      }),
      catchError(err => {
        console.error('Direct Gemini API Call Error:', err);
        const is503 = err?.status === 503 || err?.message?.includes('503');
        const userFriendlyMsg = is503
          ? '⚡ **Google Gemini Server Temporarily Busy (HTTP 503)**\n\nGoogle\'s Gemini servers are experiencing temporary high traffic or capacity limits right now.\n\n• **Retry**: Click your request chip again in a few seconds.\n• **Instant Backup**: Switch to **OpenAI (GPT-4o-mini)** in **Settings** for zero downtime!'
          : `⚠️ **Failed to connect to Gemini API**: ${err.message || 'Invalid API Key or Network Issue'}`;

        return of({
          success: false,
          responseText: userFriendlyMsg,
          actionType: req.actionType,
          errorMessage: err.message
        });
      })
    );
  }

  private buildSystemPrompt(req: AiPromptRequest): string {
    let prompt = `You are Beru, an expert, encouraging, and clear Data Structures & Algorithms (DSA) Socratic Mentor.\n`;
    prompt += `Adopt ChatGPT's signature response style: structured, clear, direct, visually engaging, and well-formatted markdown.\n`;
    prompt += `Current Problem Context:\n`;
    prompt += `- Title: ${req.questionTitle}\n`;
    prompt += `- Topic: ${req.topic}\n`;
    if (req.pattern) prompt += `- Pattern: ${req.pattern}\n`;
    prompt += `- Difficulty: ${req.stars} Stars\n`;
    if (req.notesText && req.notesText.trim()) {
      prompt += `- Student Notes/Code Snippet:\n\`\`\`\n${req.notesText}\n\`\`\`\n`;
    }
    prompt += `Instructions for ChatGPT Writing Style:\n`;
    prompt += `1. **Clear Structure**: Organize your response into logical sections with clear markdown headings (e.g., \`### 💡 Intuition\`, \`### 🧠 Step-by-Step Approach\`, \`### ⏱️ Complexity Analysis\`).\n`;
    prompt += `2. **Engaging & Direct**: Be friendly, conversational, and direct. Skip unnecessary filler meta-intros or repetitive intro lines.\n`;
    prompt += `3. **Visual Markdown**: Highlight key technical terms in **bold**, use inline \`code\` for variables/functions, and use formatted code blocks (\`\`\`python / cpp / java / js\`\`\`) when showing code.\n`;
    prompt += `4. **Socratic Intuition**: Provide intuitive explanations and progressive hints first. Do NOT dump full solution code immediately unless specifically asked.\n`;
    prompt += `5. **Language Preference**: If asked for full solution code and no language is specified (and no code is in student notes), ask which language they prefer (e.g., C++, Java, Python, JavaScript, Go) before generating full code.\n`;
    prompt += `6. **LaTeX Complexities**: Format Big-O notation cleanly using LaTeX like $O(N)$ or $O(N \\log N)$.\n`;
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
