import { ConversationMessage, HealthReport, HealthState } from '../../types/health.js';
import { REPORT_GENERATION_PROMPT } from '../../agent/prompts.js';
import { config } from '../../config/env.js';

export class ReportService {
  async generateReport(
    conversationHistory: ConversationMessage[],
    healthState: HealthState
  ): Promise<HealthReport> {
    const transcript = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    if (conversationHistory.length === 0) {
      return this.getEmptyReport();
    }

    try {
      if (config.sarvamApiKey) {
        return await this.generateLLMReport(transcript);
      }
    } catch (error) {
      console.error('LLM report generation failed, using fallback:', error);
    }

    return this.generateFallbackReport(healthState);
  }

  private async generateLLMReport(transcript: string): Promise<HealthReport> {
    try {
      const response = await fetch('https://api.sarvam.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': config.sarvamApiKey,
        },
        body: JSON.stringify({
          model: 'saarika:v1',
          messages: [
            { role: 'system', content: REPORT_GENERATION_PROMPT(transcript) },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Report generation error: ${response.statusText}`);
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse LLM report:', error);
      throw error;
    }
  }

  private generateFallbackReport(healthState: HealthState): HealthReport {
    const informationMissing: string[] = [];

    if (!healthState.name) informationMissing.push('Patient name');
    if (!healthState.mainConcern) informationMissing.push('Main concern');
    if (healthState.symptoms.length === 0) informationMissing.push('Symptoms');
    if (!healthState.duration) informationMissing.push('Duration');
    if (healthState.severity === null) informationMissing.push('Severity');
    if (healthState.relatedSymptoms.length === 0) informationMissing.push('Related symptoms');

    return {
      patientName: healthState.name,
      mainConcern: healthState.mainConcern,
      symptoms: healthState.symptoms,
      duration: healthState.duration,
      severity: healthState.severity,
      relatedSymptoms: healthState.relatedSymptoms,
      redFlags: healthState.redFlags,
      followUpNotes: healthState.redFlags.length > 0 
        ? ['Consider professional medical evaluation due to reported symptoms']
        : [],
      informationMissing,
    };
  }

  private getEmptyReport(): HealthReport {
    return {
      patientName: null,
      mainConcern: null,
      symptoms: [],
      duration: null,
      severity: null,
      relatedSymptoms: [],
      redFlags: [],
      followUpNotes: [],
      informationMissing: [
        'Patient name',
        'Main concern',
        'Symptoms',
        'Duration',
        'Severity',
        'Related symptoms',
      ],
    };
  }
}
