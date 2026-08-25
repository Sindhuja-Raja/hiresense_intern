/**
 * OpenAI Client for AI Scoring
 * 
 * Supports GPT-4o and GPT-4o-mini for production-scale candidate scoring.
 * 
 * Pricing (as of 2024):
 * - GPT-4o: $2.50/1M input, $10/1M output (best quality)
 * - GPT-4o-mini: $0.15/1M input, $0.60/1M output (best value)
 * 
 * Environment Variables:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - OPENAI_MODEL: Model to use (default: gpt-4o-mini)
 */

import OpenAI from 'openai';

export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

interface OpenAIConfig {
  apiKey: string;
  model: OpenAIModel;
  maxRetries?: number;
  timeout?: number;
}

class OpenAIClient {
  private client: OpenAI | null = null;
  private model: OpenAIModel;
  private maxRetries: number;

  constructor() {
    this.model = (process.env.OPENAI_MODEL as OpenAIModel) || 'gpt-4o-mini';
    this.maxRetries = parseInt(process.env.OPENAI_MAX_RETRIES || '3');
    this.initializeClient();
  }

  private initializeClient(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not configured - OpenAI scoring disabled');
      return;
    }

    this.client = new OpenAI({
      apiKey,
      maxRetries: this.maxRetries,
      timeout: 60000, // 60 seconds
    });

    console.log(`✅ OpenAI client initialized with model: ${this.model}`);
  }

  /**
   * Check if OpenAI is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Get the current model
   */
  getModel(): OpenAIModel {
    return this.model;
  }

  /**
   * Set the model to use
   */
  setModel(model: OpenAIModel): void {
    this.model = model;
  }

  /**
   * Generate a chat completion with JSON response
   */
  async generateJSON<T>(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.3
  ): Promise<T> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as T;
  }

  /**
   * Generate a text completion
   */
  async generateText(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7
  ): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ OpenAI attempt ${attempt}/${maxRetries} failed:`, error.message);

        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403) {
          throw error; // Auth errors - don't retry
        }

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('OpenAI operation failed after retries');
  }

  /**
   * Get estimated cost for a request (in USD)
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    const pricing: Record<OpenAIModel, { input: number; output: number }> = {
      'gpt-4o': { input: 2.50, output: 10.00 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'gpt-4-turbo': { input: 10.00, output: 30.00 },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    };

    const modelPricing = pricing[this.model];
    return (inputTokens / 1_000_000) * modelPricing.input + 
           (outputTokens / 1_000_000) * modelPricing.output;
  }
}

// Singleton instance
export const openaiClient = new OpenAIClient();
