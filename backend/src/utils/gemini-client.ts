/**
 * Gemini API Client with Multiple Key Rotation and Fallback
 * Optimized for Vercel serverless environment
 */

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Ensure environment variables are loaded before reading GEMINI_API_KEY
dotenv.config();

class GeminiClient {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private enabled: boolean;

  constructor() {
    // Collect all available API keys from environment
    this.apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter((key): key is string => Boolean(key));

    this.enabled = this.apiKeys.length > 0;

    if (!this.enabled) {
      console.warn('⚠️ Gemini client disabled: no API keys configured. Falling back to deterministic scoring.');
      return;
    }

    console.log(`✅ Gemini client initialized with ${this.apiKeys.length} API key(s)`);
  }

  /**
   * Get the next API key in rotation (stateless for serverless)
   * Uses timestamp-based rotation for distributed serverless instances
   */
  private getNextKey(): string {
    if (!this.enabled) {
      throw new Error('Gemini client is disabled');
    }
    // Rotate based on timestamp to distribute load across serverless instances
    const index = Math.floor(Date.now() / 60000) % this.apiKeys.length;
    return this.apiKeys[index];
  }

  /**
   * Create a Gemini AI instance with automatic key rotation
   */
  getClient(): GoogleGenerativeAI {
    if (!this.enabled) {
      throw new Error('Gemini client is disabled');
    }
    const apiKey = this.getNextKey();
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Execute a request with automatic fallback to other keys on rate limit
   */
  async executeWithFallback<T>(
    operation: (client: GoogleGenerativeAI) => Promise<T>,
    maxRetries: number = this.apiKeys.length
  ): Promise<T> {
    if (!this.enabled) {
      throw new Error('Gemini client is disabled');
    }
    const errors: Error[] = [];
    
    // Try all available keys
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const client = this.getClient();
        const result = await operation(client);
        
        // Success - log if we had to retry
        if (attempt > 0) {
          console.log(`✅ Request succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error: any) {
        errors.push(error);
        
        // Check if it's a rate limit error
        const isRateLimit = 
          error?.message?.includes('429') ||
          error?.message?.includes('quota') ||
          error?.message?.includes('rate limit');
        
        if (isRateLimit && attempt < maxRetries - 1) {
          console.warn(`⚠️ Rate limit hit on attempt ${attempt + 1}, trying next key...`);
          // Small delay before retry (important for serverless)
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // If not rate limit or last attempt, throw
        if (attempt === maxRetries - 1) {
          console.error(`❌ All ${maxRetries} API keys exhausted`);
          throw new Error(`Gemini API request failed after ${maxRetries} attempts: ${error.message}`);
        }
      }
    }
    
    // This shouldn't be reached, but TypeScript needs it
    throw new Error('Unexpected error in Gemini client');
  }

  /**
   * Get total number of available keys
   */
  getKeyCount(): number {
    return this.apiKeys.length;
  }

  /**
   * Whether Gemini is enabled (i.e., at least one API key is configured)
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance (will be recreated per serverless invocation)
export const geminiClient = new GeminiClient();
