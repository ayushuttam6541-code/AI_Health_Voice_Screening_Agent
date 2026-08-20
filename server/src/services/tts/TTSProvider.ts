export interface TTSProvider {
  synthesize(text: string, language: string): Promise<Buffer>;
}
