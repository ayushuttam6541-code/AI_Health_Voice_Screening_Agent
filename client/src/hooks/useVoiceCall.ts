import { useState, useCallback, useRef, useEffect } from "react";
import { WebSocketService } from "../services/websocket";
import {
  CallStatus,
  ServerEvent,
  HealthReport,
} from "../types/health";

const WS_URL =
  (import.meta as any).env.VITE_WS_URL ||
  "ws://localhost:5000/ws/voice";

export function useVoiceCall() {
  const [status, setStatus] = useState<CallStatus>("IDLE");
  const [transcript, setTranscript] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [error, setError] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [report, setReport] =
    useState<HealthReport | null>(null);

  const [isConnected, setIsConnected] =
    useState(false);

  // IMPORTANT
  const [isRecording, setIsRecording] =
    useState(false);

  const wsRef =
    useRef<WebSocketService | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const durationIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  // ==========================================
  // PLAY AUDIO
  // ==========================================

  const playAudio = useCallback(
    (base64Audio: string) => {
      setStatus("AI_SPEAKING");

      const audio = new Audio(
        `data:audio/wav;base64,${base64Audio}`
      );

      audio.onended = () => {
        console.log("AI audio finished");
        setStatus("LISTENING");
      };

      audio.onerror = () => {
        console.error("Audio playback error");
        setStatus("LISTENING");
      };

      audio.play().catch((err) => {
        console.error(
          "Failed to play audio:",
          err
        );

        setStatus("LISTENING");
      });
    },
    []
  );

  // ==========================================
  // STOP TIMER
  // ==========================================

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(
        durationIntervalRef.current
      );

      durationIntervalRef.current = null;
    }
  }, []);

  // ==========================================
  // START TIMER
  // ==========================================

  const startDurationTimer = useCallback(() => {
    setCallDuration(0);

    stopDurationTimer();

    durationIntervalRef.current =
      setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
  }, [stopDurationTimer]);

  // ==========================================
  // WEBSOCKET
  // ==========================================

  const connectWebSocket = useCallback(
    async () => {
      try {
        console.log(
          "Attempting to connect to WebSocket:",
          WS_URL
        );

        const ws =
          new WebSocketService(WS_URL);

        await ws.connect();

        console.log(
          "WebSocket connected successfully"
        );

        wsRef.current = ws;

        setIsConnected(true);

        // CALL STARTED
        ws.on("call_started", () => {
          console.log(
            "Call started event received"
          );

          setStatus("LISTENING");
          setError("");
        });

        // PROCESSING
        ws.on("processing", () => {
          console.log(
            "Processing event received"
          );

          setStatus("PROCESSING");
        });

        // TRANSCRIPT
        ws.on(
          "transcript",
          (data: ServerEvent) => {
            console.log(
              "Transcript received:",
              data.text
            );

            setTranscript(data.text || "");

            setStatus("LISTENING");
          }
        );

        // ASSISTANT TEXT
        ws.on(
          "assistant_text",
          (data: ServerEvent) => {
            console.log(
              "Assistant text received:",
              data.text
            );

            setAssistantMessage(
              data.text || ""
            );
          }
        );

        // ASSISTANT AUDIO
        ws.on(
          "assistant_audio",
          (data: ServerEvent) => {
            console.log(
              "Assistant audio received"
            );

            if (data.data) {
              playAudio(data.data);
            }
          }
        );

        // REPORT
        ws.on(
          "report",
          (data: ServerEvent) => {
            console.log(
              "Report received:",
              data.report
            );

            if (data.report) {
              setReport(data.report);
              setStatus("ENDED");

              stopDurationTimer();
            }
          }
        );

        // ERROR
        ws.on(
          "error",
          (data: ServerEvent) => {
            console.error(
              "Server error:",
              data.message
            );

            setError(
              data.message ||
                "An error occurred"
            );

            setStatus("ERROR");
          }
        );
      } catch (err) {
        console.error(
          "WebSocket connection error:",
          err
        );

        setError(
          "Failed to connect to server: " +
            (err as Error).message
        );

        setStatus("ERROR");

        setIsConnected(false);
      }
    },
    [playAudio, stopDurationTimer]
  );

  // ==========================================
  // START CALL
  // ==========================================

  const startCall = useCallback(async () => {
    console.log("START CALL");

    setError("");
    setReport(null);
    setTranscript("");
    setAssistantMessage("");

    await connectWebSocket();

    const ws = wsRef.current;

    if (ws?.isConnected()) {
      console.log(
        "Sending start_call"
      );

      ws.send({
        type: "start_call",
      });

      startDurationTimer();
    } else {
      console.error(
        "WebSocket is not connected"
      );

      setError(
        "WebSocket is not connected"
      );

      setStatus("ERROR");
    }
  }, [
    connectWebSocket,
    startDurationTimer,
  ]);

  // ==========================================
  // START RECORDING
  // ==========================================

  const startRecording = useCallback(
    async () => {
      try {
        console.log(
          "START RECORDING clicked"
        );

        // Prevent duplicate recording
        if (isRecording) {
          console.log(
            "Already recording"
          );

          return;
        }

        // WebSocket check
        if (!wsRef.current?.isConnected()) {
          setError(
            "WebSocket is not connected"
          );

          return;
        }

        // Existing recorder check
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current
            .state !== "inactive"
        ) {
          console.log(
            "Recorder already active"
          );

          return;
        }

        console.log(
          "Requesting microphone permission..."
        );

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        streamRef.current = stream;

        console.log(
          "Microphone permission granted"
        );

        // Determine supported format
        const mimeType =
          MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
          )
            ? "audio/webm;codecs=opus"
            : "audio/webm";

        console.log(
          "Using audio format:",
          mimeType
        );

        const mediaRecorder =
          new MediaRecorder(stream, {
            mimeType,
          });

        mediaRecorderRef.current =
          mediaRecorder;

        // ====================================
        // RECORDER START
        // ====================================

        mediaRecorder.onstart = () => {
          console.log(
            "MediaRecorder started"
          );

          setIsRecording(true);

          wsRef.current?.send({
            type: "audio_start",
          });

          console.log(
            "audio_start sent"
          );
        };

        // ====================================
        // AUDIO CHUNKS
        // ====================================

        mediaRecorder.ondataavailable =
          async (event) => {
            if (event.data.size === 0) {
              return;
            }

            console.log(
              "Audio chunk size:",
              event.data.size
            );

            if (
              !wsRef.current?.isConnected()
            ) {
              console.error(
                "WebSocket disconnected"
              );

              return;
            }

            try {
              const arrayBuffer =
                await event.data.arrayBuffer();

              const bytes =
                new Uint8Array(
                  arrayBuffer
                );

              let binary = "";

              for (
                let i = 0;
                i < bytes.length;
                i++
              ) {
                binary += String.fromCharCode(
                  bytes[i]
                );
              }

              const base64 =
                btoa(binary);

              wsRef.current.send({
                type: "audio_chunk",
                data: base64,
              });
            } catch (err) {
              console.error(
                "Failed to process audio chunk:",
                err
              );
            }
          };

        // ====================================
        // RECORDER ERROR
        // ====================================

        mediaRecorder.onerror = (event) => {
          console.error(
            "MediaRecorder error:",
            event
          );

          setIsRecording(false);
        };

        // ====================================
        // RECORDER STOP
        // ====================================

        mediaRecorder.onstop = () => {
          console.log(
            "MediaRecorder completely stopped"
          );

          setIsRecording(false);

          // Send audio_end ONLY here
          wsRef.current?.send({
            type: "audio_end",
          });

          console.log(
            "audio_end sent"
          );

          // Stop microphone
          if (streamRef.current) {
            streamRef.current
              .getTracks()
              .forEach((track) => {
                track.stop();
              });

            streamRef.current = null;
          }

          mediaRecorderRef.current =
            null;
        };

        // ====================================
        // START
        // ====================================

        mediaRecorder.start(500);

        console.log(
          "Recording started"
        );
      } catch (err) {
        console.error(
          "Microphone error:",
          err
        );

        setIsRecording(false);

        setError(
          "Microphone access denied or unavailable"
        );
      }
    },
    [isRecording]
  );

  // ==========================================
  // STOP RECORDING
  // ==========================================

  const stopRecording = useCallback(() => {
    console.log(
      "STOP RECORDING clicked"
    );

    const recorder =
      mediaRecorderRef.current;

    if (!recorder) {
      console.log(
        "No MediaRecorder found"
      );

      setIsRecording(false);

      return;
    }

    console.log(
      "Recorder state:",
      recorder.state
    );

    if (
      recorder.state === "inactive"
    ) {
      console.log(
        "Recorder already inactive"
      );

      setIsRecording(false);

      return;
    }

    console.log(
      "Calling recorder.stop()"
    );

    recorder.stop();

    // onstop will:
    // 1. set isRecording false
    // 2. send audio_end
    // 3. stop microphone
  }, []);

  // ==========================================
  // END CALL
  // ==========================================

  const endCall = useCallback(() => {
    console.log(
      "END CALL clicked"
    );

    // Don't end while recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      setError(
        "Please stop speaking first, then end the call."
      );

      return;
    }

    stopDurationTimer();

    if (wsRef.current?.isConnected()) {
      console.log(
        "Sending end_call"
      );

      wsRef.current.send({
        type: "end_call",
      });

      setStatus("PROCESSING");
    }
  }, [stopDurationTimer]);

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      console.log(
        "Cleaning up voice call"
      );

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      stopDurationTimer();

      wsRef.current?.disconnect();
    };
  }, [stopDurationTimer]);

  // ==========================================
  // FORMAT DURATION
  // ==========================================

  const formatDuration = useCallback(
    (seconds: number) => {
      const mins = Math.floor(
        seconds / 60
      );

      const secs = seconds % 60;

      return `${mins}:${secs
        .toString()
        .padStart(2, "0")}`;
    },
    []
  );

  // ==========================================
  // RETURN
  // ==========================================

  return {
    status,
    transcript,
    assistantMessage,
    error,
    callDuration,
    formatDuration,
    report,

    isConnected,

    // IMPORTANT
    isRecording,

    startCall,
    startRecording,
    stopRecording,
    endCall,
  };
}