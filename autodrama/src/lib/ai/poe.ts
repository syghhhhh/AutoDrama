/**
 * Poe API client for AI text generation.
 * Supports chat completions with retry logic and error handling.
 */

import type {
  PoeChatRequest,
  PoeChatResponse,
  PoeError,
  PoeMessage,
  RetryConfig,
  AIModelConfig,
} from "@/types/ai";

// Default configuration
const DEFAULT_MODEL = "gemini-3-flash";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;

// Retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableErrors: ["rate_limit", "timeout", "server_error", "overloaded"],
};

/**
 * Poe API client class
 */
export class PoeClient {
  private apiKey: string;
  private baseUrl: string;
  private retryConfig: RetryConfig;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.POE_API_KEY || "";
    this.baseUrl = "https://api.poe.com/v1";
    this.retryConfig = DEFAULT_RETRY_CONFIG;

    if (!this.apiKey) {
      throw new Error("POE_API_KEY is required but not provided");
    }
  }

  /**
   * Make a chat completion request to Poe API
   */
  async chatCompletion(
    messages: PoeMessage[],
    config?: Partial<AIModelConfig>
  ): Promise<string> {
    const request: PoeChatRequest = {
      model: config?.model || DEFAULT_MODEL,
      messages,
      temperature: config?.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: config?.maxTokens ?? DEFAULT_MAX_TOKENS,
      stream: false,
    };

    return this.makeRequestWithRetry(request);
  }

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry(request: PoeChatRequest): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.makeRequest(request);
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Don't wait after the last attempt
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.warn(
            `Poe API request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}). Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  /**
   * Make a single request to Poe API
   */
  private async makeRequest(request: PoeChatRequest): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    // Parse response
    const data = await response.json();

    // Handle error response
    if (!response.ok) {
      const errorData = data as PoeError;
      const errorCode = errorData.error?.code || "unknown_error";
      const errorMessage = errorData.error?.message || "Unknown error occurred";

      // Create error with code for retry logic
      const error = new Error(`Poe API error (${errorCode}): ${errorMessage}`);
      (error as Error & { code: string }).code = errorCode;
      throw error;
    }

    // Parse success response
    const chatResponse = data as PoeChatResponse;

    if (!chatResponse.choices || chatResponse.choices.length === 0) {
      throw new Error("Poe API returned no choices");
    }

    return chatResponse.choices[0].message.content;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    const errorCode = (error as Error & { code?: string })?.code;
    const errorMessage = (error as Error)?.message?.toLowerCase() || "";

    // Check for specific error codes
    if (errorCode && this.retryConfig.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check for common retryable patterns in error message
    const retryablePatterns = [
      "rate_limit",
      "rate limit",
      "too many requests",
      "timeout",
      "server_error",
      "internal server error",
      "overloaded",
      "service unavailable",
      "503",
      "429",
      "500",
    ];

    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let poeClient: PoeClient | null = null;

/**
 * Get the Poe client instance
 */
export function getPoeClient(): PoeClient {
  if (!poeClient) {
    poeClient = new PoeClient();
  }
  return poeClient;
}

/**
 * Simple chat completion helper function
 */
export async function chatCompletion(
  messages: PoeMessage[],
  config?: Partial<AIModelConfig>
): Promise<string> {
  const client = getPoeClient();
  return client.chatCompletion(messages, config);
}