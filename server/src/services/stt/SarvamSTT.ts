import { STTProvider } from "./STTProvider.js";
import { config } from "../../config/env.js";

export class SarvamSTT implements STTProvider {
  async transcribe(
    audioBuffer: Buffer,
    language: string = "en"
  ): Promise<string> {
    if (!config.sarvamApiKey) {
      throw new Error("Sarvam API key not configured");
    }

    try {
      console.log(
        "Sending audio to Sarvam. Buffer size:",
        audioBuffer.length
      );

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("Audio buffer is empty");
      }

      // Create multipart/form-data
      const formData = new FormData();

      // Convert Node Buffer -> Blob
      const audioBlob = new Blob(
        [new Uint8Array(audioBuffer)],
        {
          type: "audio/webm",
        }
      );

      // IMPORTANT: Sarvam expects field name "file"
      formData.append(
        "file",
        audioBlob,
        "recording.webm"
      );

      // Current Sarvam STT model
      formData.append(
        "model",
        "saaras:v3"
      );

      // Transcribe in original language
      formData.append(
        "mode",
        "transcribe"
      );

      // If you specifically know the language,
      // send it. Otherwise Sarvam can detect it.
      if (language === "hi") {
        formData.append(
          "language_code",
          "hi-IN"
        );
      } else {
        formData.append(
          "language_code",
          "en-IN"
        );
      }

      const response = await fetch(
        "https://api.sarvam.ai/speech-to-text",
        {
          method: "POST",

          headers: {
            "api-subscription-key":
              config.sarvamApiKey,
          },

          // DO NOT manually set Content-Type.
          // fetch will automatically add:
          // multipart/form-data; boundary=...
          body: formData,
        }
      );

      const responseText =
        await response.text();

      console.log(
        "Sarvam HTTP status:",
        response.status
      );

      console.log(
        "Sarvam raw response:",
        responseText
      );

      if (!response.ok) {
        throw new Error(
          `Sarvam STT error: ${response.status} ${responseText}`
        );
      }

      const data = JSON.parse(
        responseText
      ) as {
        transcript?: string;
        language_code?: string;
      };

      console.log(
        "Sarvam transcript:",
        data.transcript
      );

      return data.transcript || "";
    } catch (error) {
      console.error(
        "========== SARVAM STT ERROR =========="
      );

      console.error(error);

      console.error(
        "======================================"
      );

      throw error;
    }
  }
}