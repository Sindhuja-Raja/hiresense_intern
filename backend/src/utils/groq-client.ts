/**
 * Groq API Client
 * Uses llama-3.3-70b-versatile (free tier, very fast)
 * Drop-in replacement for the Gemini client used in AI Search.
 */

import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

class GroqClient {
  private client: Groq | null = null;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.client = new Groq({ apiKey });
      this.enabled = true;
      console.log('✅ Groq client initialized');
    } else {
      this.enabled = false;
      console.warn('⚠️ Groq client disabled: GROQ_API_KEY not set in .env');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send a chat completion request and return the text response.
   * Model: llama-3.3-70b-versatile (free, fast, great for JSON extraction)
   */
  async complete(
    prompt: string,
    systemPrompt: string = 'You are a helpful AI assistant. Always respond with valid JSON only.',
    temperature: number = 0.1
  ): Promise<string> {
    if (!this.enabled || !this.client) {
      throw new Error('Groq client is disabled — set GROQ_API_KEY in backend/.env');
    }

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message?.content ?? '{}';
  }
}

export const groqClient = new GroqClient();
