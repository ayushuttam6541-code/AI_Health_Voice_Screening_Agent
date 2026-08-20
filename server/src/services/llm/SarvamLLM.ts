import { LLMProvider } from "./LLMProvider.js";
import {
  ConversationMessage,
  LLMResponse,
  HealthState,
} from "../../types/health.js";
import { SYSTEM_PROMPT } from "../../agent/prompts.js";
import { config } from "../../config/env.js";

export class SarvamLLM implements LLMProvider {
  async generateResponse(
    conversationHistory: ConversationMessage[],
    healthState: HealthState,
    userMessage: string
  ): Promise<LLMResponse> {
    if (!config.sarvamApiKey) {
      throw new Error("Sarvam API key not configured");
    }

    try {
      console.log("=================================");
      console.log("[Sarvam LLM] User:", userMessage);
      console.log("[Sarvam LLM] State:", healthState);
      console.log("[Sarvam LLM] Calling API...");
      console.log("=================================");

      const messages = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },

        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),

        {
          role: "user",
          content: `
Current health state:
${JSON.stringify(healthState, null, 2)}

User's latest response:
${userMessage}

Return ONLY the JSON object requested in the system prompt.
          `,
        },
      ];

      const response = await fetch(
        "https://api.sarvam.ai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": config.sarvamApiKey,
          },

          body: JSON.stringify({
            model: "sarvam-105b",

            messages,

            temperature: 0.2,

            max_tokens: 500,

            response_format: {
              type: "json_object",
            },
          }),
        }
      );

      const responseText = await response.text();

      console.log(
        "[Sarvam LLM] Status:",
        response.status
      );

      console.log(
        "[Sarvam LLM] Raw response:",
        responseText.substring(0, 3000)
      );

      if (!response.ok) {
        throw new Error(
          `Sarvam LLM error ${response.status}: ${responseText}`
        );
      }

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Invalid Sarvam response: ${responseText}`
        );
      }

      const content =
        data?.choices?.[0]?.message?.content;

      console.log(
        "[Sarvam LLM] Content:",
        content
      );

      if (!content) {
        throw new Error(
          "Sarvam LLM returned empty content"
        );
      }

      return this.parseLLMResponse(
        content,
        healthState
      );

    } catch (error) {
      console.error(
        "========== SARVAM LLM ERROR =========="
      );

      console.error(error);

      console.error(
        "======================================"
      );

      throw error;
    }
  }

  private parseLLMResponse(
    content: string,
    currentState: HealthState
  ): LLMResponse {
    try {
      let cleaned = content.trim();

      // Remove markdown fences if model sends them
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(cleaned);

      console.log(
        "[Sarvam LLM] Parsed JSON:",
        parsed
      );

      const stateUpdate = {
        ...(parsed.stateUpdate || {}),
      };

      if (parsed.language) {
        stateUpdate.language =
          parsed.language;
      }

      return {
        reply:
          parsed.reply ||
          "Could you please tell me a little more?",

        language:
          parsed.language ||
          currentState.language ||
          "en",

        stateUpdate,

        nextField:
          parsed.nextField || null,

        screeningComplete:
          parsed.screeningComplete === true,

        redFlags:
          Array.isArray(parsed.redFlags)
            ? parsed.redFlags
            : [],
      };

    } catch (error) {
      console.error(
        "[Sarvam LLM] JSON parse error:",
        error
      );

      console.error(
        "[Sarvam LLM] Invalid content:",
        content
      );

      // Don't show generic fallback if model
      // actually returned useful text.
      return {
        reply: content,

        language:
          currentState.language || "en",

        stateUpdate: {},

        nextField: null,

        screeningComplete: false,

        redFlags: [],
      };
    }
  }
}