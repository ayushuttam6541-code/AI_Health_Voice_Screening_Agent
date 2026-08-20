import { ConversationMessage, LLMResponse, HealthState } from '../../types/health.js';

export interface LLMProvider {
  generateResponse(
    conversationHistory: ConversationMessage[],
    healthState: HealthState,
    userMessage: string
  ): Promise<LLMResponse>;
}
