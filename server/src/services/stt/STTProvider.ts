export interface STTProvider {
  transcribe(audioBuffer: Buffer, language?: string): Promise<string>;
}
