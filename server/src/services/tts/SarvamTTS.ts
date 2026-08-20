import { TTSProvider } from "./TTSProvider.js";
import { config } from "../../config/env.js";

export class SarvamTTS implements TTSProvider {
  async synthesize(
    text: string,
    language: string = "en"
  ): Promise<Buffer> {
    if (!config.sarvamApiKey) {
      throw new Error("Sarvam API key not configured");
    }

    if (!text || text.trim().length === 0) {
      throw new Error("Text is empty");
    }

    const languageCode =
      language === "hi" ? "hi-IN" : "en-IN";

    console.log(
      `[Sarvam TTS] Text: ${text}`
    );

    console.log(
      `[Sarvam TTS] Language: ${languageCode}`
    );

    try {
      const response = await fetch(
        "https://api.sarvam.ai/text-to-speech",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "api-subscription-key":
              config.sarvamApiKey,
          },

          body: JSON.stringify({
            text: text,

            target_language_code:
              languageCode,

            model: "bulbul:v2",

            speaker: "anushka",

            pace: 1,

            pitch: 0,

            loudness: 1,

            speech_sample_rate: 22050,

            output_audio_codec: "wav",
          }),
        }
      );

      const responseText =
        await response.text();

      console.log(
        "[Sarvam TTS] Status:",
        response.status
      );

      console.log(
        "[Sarvam TTS] Response:",
        responseText.substring(0, 1000)
      );

      if (!response.ok) {
        throw new Error(
          `Sarvam TTS error ${response.status}: ${responseText}`
        );
      }

      const data = JSON.parse(
        responseText
      ) as {
        audios?: string[];
      };

      if (
        !data.audios ||
        !data.audios[0]
      ) {
        throw new Error(
          "Sarvam TTS returned no audio"
        );
      }

      const audioBuffer = Buffer.from(
        data.audios[0],
        "base64"
      );

      console.log(
        `[Sarvam TTS] Audio generated: ${audioBuffer.length} bytes`
      );

      return audioBuffer;
    } catch (error) {
      console.error(
        "========== SARVAM TTS ERROR =========="
      );

      console.error(error);

      console.error(
        "======================================"
      );

      throw error;
    }
  }
}