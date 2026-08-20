import { HealthState, ConversationMessage } from '../types/health.js';

export interface ConversationSession {
  sessionId: string;
  conversationHistory: ConversationMessage[];
  healthState: HealthState;
  startTime: number;
  language: "en" | "hi" | "hinglish";
  audioBuffer: Buffer[];
}

class SessionStore {
  private sessions: Map<string, ConversationSession> = new Map();

  createSession(sessionId: string): ConversationSession {
    const session: ConversationSession = {
      sessionId,
      conversationHistory: [],
      healthState: {
        name: null,
        mainConcern: null,
        symptoms: [],
        duration: null,
        severity: null,
        relatedSymptoms: [],
        redFlags: [],
        language: "en",
        completed: false,
      },
      startTime: Date.now(),
      language: "en",
      audioBuffer: [],
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): ConversationSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<ConversationSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  addMessage(sessionId: string, message: ConversationMessage): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.conversationHistory.push(message);
    }
  }

  updateHealthState(sessionId: string, updates: Partial<HealthState>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.healthState = { ...session.healthState, ...updates };
    }
  }

  addAudioChunk(sessionId: string, chunk: Buffer): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.audioBuffer.push(chunk);
    }
  }

  clearAudioBuffer(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.audioBuffer = [];
    }
  }

  getAudioBuffer(sessionId: string): Buffer {
    const session = this.sessions.get(sessionId);
    if (session) {
      return Buffer.concat(session.audioBuffer);
    }
    return Buffer.alloc(0);
  }
}

export const sessionStore = new SessionStore();
