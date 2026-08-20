import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  sarvamApiKey: process.env.SARVAM_API_KEY || '',
  sttProvider: process.env.STT_PROVIDER || 'sarvam',
  llmProvider: process.env.LLM_PROVIDER || 'sarvam',
  ttsProvider: process.env.TTS_PROVIDER || 'sarvam',
};
