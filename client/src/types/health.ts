export interface HealthState {
  name: string | null;
  mainConcern: string | null;
  symptoms: string[];
  duration: string | null;
  severity: number | null;
  relatedSymptoms: string[];
  redFlags: string[];
  language: "en" | "hi" | "hinglish";
  completed: boolean;
}

export interface HealthReport {
  patientName: string | null;
  mainConcern: string | null;
  symptoms: string[];
  duration: string | null;
  severity: number | null;
  relatedSymptoms: string[];
  redFlags: string[];
  followUpNotes: string[];
  informationMissing: string[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type CallStatus = "IDLE" | "LISTENING" | "PROCESSING" | "AI_SPEAKING" | "ERROR" | "ENDED";

export interface ClientEvent {
  type: "start_call" | "audio_start" | "audio_chunk" | "audio_end" | "end_call";
  sessionId?: string;
  data?: string;
}

export interface ServerEvent {
  type: "call_started" | "processing" | "transcript" | "assistant_text" | "assistant_audio" | "report" | "error";
  text?: string;
  data?: string;
  report?: HealthReport;
  message?: string;
}
