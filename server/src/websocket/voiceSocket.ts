import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

import {
  ClientEvent,
  ServerEvent,
} from "../types/health.js";

import { sessionStore } from "../session/sessionStore.js";
import { ConversationEngine } from "../agent/conversationEngine.js";
import { SarvamSTT } from "../services/stt/SarvamSTT.js";
import { SarvamTTS } from "../services/tts/SarvamTTS.js";
import { ReportService } from "../services/report/reportService.js";

export function setupVoiceSocket(server: any) {
  const wss = new WebSocketServer({
    server,
    path: "/ws/voice",
  });

  const conversationEngine =
    new ConversationEngine();

  const sttProvider =
    new SarvamSTT();

  const ttsProvider =
    new SarvamTTS();

  const reportService =
    new ReportService();

  console.log(
    "Voice WebSocket server initialized"
  );

  wss.on(
    "connection",
    (ws: WebSocket) => {
      const sessionId = uuidv4();

      console.log(
        `[${sessionId}] WebSocket connected`
      );

      ws.on(
        "message",
        async (data: Buffer) => {
          try {
            const event: ClientEvent =
              JSON.parse(
                data.toString()
              );

            console.log(
              `[${sessionId}] Event: ${event.type}`
            );

            await handleEvent(
              event,
              ws,
              sessionId,
              conversationEngine,
              sttProvider,
              ttsProvider,
              reportService
            );
          } catch (error) {
            console.error(
              `[${sessionId}] Message error:`,
              error
            );

            sendError(
              ws,
              "Failed to process message"
            );
          }
        }
      );

      ws.on("close", () => {
        console.log(
          `[${sessionId}] WebSocket closed`
        );

        sessionStore.deleteSession(
          sessionId
        );
      });

      ws.on("error", (error) => {
        console.error(
          `[${sessionId}] WebSocket error:`,
          error
        );
      });
    }
  );
}

// ======================================================
// HANDLE EVENT
// ======================================================

async function handleEvent(
  event: ClientEvent,
  ws: WebSocket,
  sessionId: string,
  conversationEngine: ConversationEngine,
  sttProvider: SarvamSTT,
  ttsProvider: SarvamTTS,
  reportService: ReportService
) {
  switch (event.type) {
    case "start_call":
      await handleStartCall(
        ws,
        sessionId,
        conversationEngine,
        ttsProvider
      );
      break;

    case "audio_start":
      handleAudioStart(
        ws,
        sessionId
      );
      break;

    case "audio_chunk":
      handleAudioChunk(
        ws,
        sessionId,
        event.data
      );
      break;

    case "audio_end":
      await handleAudioEnd(
        ws,
        sessionId,
        conversationEngine,
        sttProvider,
        ttsProvider
      );
      break;

    case "end_call":
      await handleEndCall(
        ws,
        sessionId,
        reportService
      );
      break;

    default:
      console.warn(
        `[${sessionId}] Unknown event:`,
        (event as any).type
      );
  }
}

// ======================================================
// START CALL
// ======================================================

async function handleStartCall(
  ws: WebSocket,
  sessionId: string,
  conversationEngine: ConversationEngine,
  ttsProvider: SarvamTTS
) {
  try {
    console.log(
      `[${sessionId}] Creating session`
    );

    sessionStore.createSession(
      sessionId
    );

    const session =
      sessionStore.getSession(
        sessionId
      );

    if (!session) {
      sendError(
        ws,
        "Unable to create voice session"
      );
      return;
    }

    const greeting =
      conversationEngine.getInitialGreeting(
        "en"
      );

    sessionStore.addMessage(
      sessionId,
      {
        role: "assistant",
        content: greeting,
        timestamp: Date.now(),
      }
    );

    sendEvent(ws, {
      type: "call_started",
    });

    sendEvent(ws, {
      type: "assistant_text",
      text: greeting,
    });

    // TTS should not break call
    try {
      const audio =
        await ttsProvider.synthesize(
          greeting,
          "en"
        );

      sendEvent(ws, {
        type: "assistant_audio",
        data: audio.toString("base64"),
      });
    } catch (error) {
      console.error(
        `[${sessionId}] Greeting TTS error:`,
        error
      );
    }

    console.log(
      `[${sessionId}] Call started successfully`
    );
  } catch (error) {
    console.error(
      `[${sessionId}] Start call error:`,
      error
    );

    sendError(
      ws,
      "Unable to start call"
    );
  }
}

// ======================================================
// AUDIO START
// ======================================================

function handleAudioStart(
  ws: WebSocket,
  sessionId: string
) {
  const session =
    sessionStore.getSession(
      sessionId
    );

  if (!session) {
    sendError(
      ws,
      "Session not found. Please start a new call."
    );
    return;
  }

  console.log(
    `[${sessionId}] Audio recording started`
  );

  sessionStore.clearAudioBuffer(
    sessionId
  );
}

// ======================================================
// AUDIO CHUNK
// ======================================================

function handleAudioChunk(
  ws: WebSocket,
  sessionId: string,
  base64Audio?: string
) {
  if (!base64Audio) {
    return;
  }

  const session =
    sessionStore.getSession(
      sessionId
    );

  if (!session) {
    sendError(
      ws,
      "Session not found."
    );
    return;
  }

  try {
    const audioBuffer =
      Buffer.from(
        base64Audio,
        "base64"
      );

    if (
      audioBuffer.length === 0
    ) {
      return;
    }

    sessionStore.addAudioChunk(
      sessionId,
      audioBuffer
    );
  } catch (error) {
    console.error(
      `[${sessionId}] Audio chunk error:`,
      error
    );
  }
}

// ======================================================
// AUDIO END
// ======================================================

async function handleAudioEnd(
  ws: WebSocket,
  sessionId: string,
  conversationEngine: ConversationEngine,
  sttProvider: SarvamSTT,
  ttsProvider: SarvamTTS
) {
  console.log(
    `[${sessionId}] Audio ended`
  );

  const session =
    sessionStore.getSession(
      sessionId
    );

  if (!session) {
    sendError(
      ws,
      "Session not found. Please start a new call."
    );
    return;
  }

  sendEvent(ws, {
    type: "processing",
  });

  try {
    const audioBuffer =
      sessionStore.getAudioBuffer(
        sessionId
      );

    console.log(
      `[${sessionId}] Total audio size: ${audioBuffer.length} bytes`
    );

    sessionStore.clearAudioBuffer(
      sessionId
    );

    if (
      !audioBuffer ||
      audioBuffer.length === 0
    ) {
      sendError(
        ws,
        "I didn't catch that. Please try again."
      );
      return;
    }

    // ==============================================
    // STT
    // ==============================================

    console.log(
      `[${sessionId}] Sending audio to Sarvam STT`
    );

    const transcript =
      await sttProvider.transcribe(
        audioBuffer,
        session.language || "en"
      );

    console.log(
      `[${sessionId}] Transcript:`,
      transcript
    );

    if (
      !transcript ||
      transcript.trim().length === 0
    ) {
      sendError(
        ws,
        "I couldn't understand that. Please repeat."
      );
      return;
    }

    sendEvent(ws, {
      type: "transcript",
      text: transcript,
    });

    // ==============================================
    // SAVE USER MESSAGE
    // ==============================================

    sessionStore.addMessage(
      sessionId,
      {
        role: "user",
        content: transcript,
        timestamp: Date.now(),
      }
    );

    // ==============================================
    // LLM
    // ==============================================

    console.log(
      `[${sessionId}] Processing conversation`
    );

    const llmResponse =
      await conversationEngine.processUserMessage(
        session.conversationHistory,
        session.healthState,
        transcript
      );

    console.log(
      `[${sessionId}] AI response:`,
      llmResponse.reply
    );

    // ==============================================
    // UPDATE STATE
    // ==============================================

    sessionStore.updateHealthState(
      sessionId,
      llmResponse.stateUpdate
    );

    session.language =
      llmResponse.language ||
      session.language ||
      "en";

    // ==============================================
    // SAVE AI MESSAGE
    // ==============================================

    sessionStore.addMessage(
      sessionId,
      {
        role: "assistant",
        content: llmResponse.reply,
        timestamp: Date.now(),
      }
    );

    // ==============================================
    // SEND TEXT
    // ==============================================

    sendEvent(ws, {
      type: "assistant_text",
      text: llmResponse.reply,
    });

    // ==============================================
    // TTS
    // ==============================================

    try {
      console.log(
        `[${sessionId}] Generating TTS`
      );

      const responseAudio =
        await ttsProvider.synthesize(
          llmResponse.reply,
          session.language
        );

      sendEvent(ws, {
        type: "assistant_audio",
        data: responseAudio.toString(
          "base64"
        ),
      });

      console.log(
        `[${sessionId}] TTS completed`
      );
    } catch (ttsError) {
      console.error(
        `[${sessionId}] TTS error:`,
        ttsError
      );

      // Text response is still sent.
    }

    console.log(
      `[${sessionId}] Audio processing completed`
    );
  } catch (error) {
    console.error(
      `[${sessionId}] Audio processing error:`,
      error
    );

    sendError(
      ws,
      "I'm having trouble processing that. Let's try again."
    );
  }
}

// ======================================================
// END CALL
// ======================================================

async function handleEndCall(
  ws: WebSocket,
  sessionId: string,
  reportService: ReportService
) {
  console.log(
    `[${sessionId}] End call requested`
  );

  const session =
    sessionStore.getSession(
      sessionId
    );

  if (!session) {
    sendError(
      ws,
      "Session not found. Please start a new call."
    );
    return;
  }

  try {
    const report =
      await reportService.generateReport(
        session.conversationHistory,
        session.healthState
      );

    sendEvent(ws, {
      type: "report",
      report,
    });

    sessionStore.deleteSession(
      sessionId
    );

    console.log(
      `[${sessionId}] Session deleted`
    );
  } catch (error) {
    console.error(
      `[${sessionId}] Report error:`,
      error
    );

    try {
      const fallbackReport =
        reportService[
          "generateFallbackReport"
        ](
          session.healthState
        );

      sendEvent(ws, {
        type: "report",
        report: fallbackReport,
      });

      sessionStore.deleteSession(
        sessionId
      );
    } catch (fallbackError) {
      console.error(
        fallbackError
      );

      sendError(
        ws,
        "Unable to generate health report"
      );
    }
  }
}

// ======================================================
// SEND EVENT
// ======================================================

function sendEvent(
  ws: WebSocket,
  event: ServerEvent
) {
  if (
    ws.readyState === WebSocket.OPEN
  ) {
    ws.send(
      JSON.stringify(event)
    );
  }
}

// ======================================================
// SEND ERROR
// ======================================================

function sendError(
  ws: WebSocket,
  message: string
) {
  console.error(
    "Server error:",
    message
  );

  sendEvent(ws, {
    type: "error",
    message,
  });
}