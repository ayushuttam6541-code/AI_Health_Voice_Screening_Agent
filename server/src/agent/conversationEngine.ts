import {
  ConversationMessage,
  HealthState,
  LLMResponse,
} from "../types/health.js";

import { LLMProvider } from "../services/llm/LLMProvider.js";
import { SarvamLLM } from "../services/llm/SarvamLLM.js";

export class ConversationEngine {
  private llmProvider: LLMProvider;

  constructor() {
    this.llmProvider = new SarvamLLM();
  }

  async processUserMessage(
    conversationHistory: ConversationMessage[],
    healthState: HealthState,
    userMessage: string
  ): Promise<LLMResponse> {
    console.log(
      "[ConversationEngine] User message:",
      userMessage
    );

    try {
      const response =
        await this.llmProvider.generateResponse(
          conversationHistory,
          healthState,
          userMessage
        );

      console.log(
        "[ConversationEngine] Response:",
        response
      );

      return response;

    } catch (error) {
      console.error(
        "[ConversationEngine] Error:",
        error
      );

      return this.getFallbackResponse(
        healthState
      );
    }
  }

  private getFallbackResponse(
    healthState: HealthState
  ): LLMResponse {
    return {
      reply:
        "I'm having trouble processing that. Could you please repeat?",

      language:
        healthState.language || "en",

      stateUpdate: {},

      nextField: null,

      screeningComplete: false,

      redFlags: [],
    };
  }

  getInitialGreeting(
    language: string = "en"
  ): string {
    if (language === "hi") {
      return "Namaste! Main aapki AI health screening assistant hoon. Main aapse kuch sawal poochunga aapke symptoms ke baare mein. Ye koi medical diagnosis nahi hai. Aapka naam kya hai?";
    }

    return "Namaste! I'm your AI health screening assistant. I'll ask you a few questions about your symptoms. This is not a medical diagnosis. What is your name?";
  }
}