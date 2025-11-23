import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OpenAIProvider } from './openai.service';

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  generateResponse(prompt: string, context?: string): Promise<LLMResponse>;
}

@Injectable()
export class GeminiProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('GEMINI_API_KEY') || '';
  }

  async generateResponse(prompt: string, context?: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: context ? `${context}\n\n${prompt}` : prompt }]
          }]
        }
      );

      return {
        content: response.data.candidates[0].content.parts[0].text,
        usage: {
          promptTokens: response.data.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.data.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error) {
      this.logger.error('Gemini API error:', error.response?.data || error.message);
      throw new Error('Failed to generate response from Gemini');
    }
  }
}

@Injectable()
export class OpenRouterProvider implements LLMProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('OPENROUTER_API_KEY') || '';
  }

  async generateResponse(prompt: string, context?: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3-haiku',
          messages: [
            { role: 'system', content: context || '' },
            { role: 'user', content: prompt }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      this.logger.error('OpenRouter API error:', error.response?.data || error.message);
      throw new Error('Failed to generate response from OpenRouter');
    }
  }
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private provider: LLMProvider;

  constructor(
    private configService: ConfigService,
    private geminiProvider: GeminiProvider,
    private openRouterProvider: OpenRouterProvider,
    private openAIProvider: OpenAIProvider
  ) {
    const providerName = this.configService.get('LLM_PROVIDER', 'openai');
    if (providerName === 'openai') {
      this.provider = this.openAIProvider;
    } else if (providerName === 'openrouter') {
      this.provider = this.openRouterProvider;
    } else {
      this.provider = this.geminiProvider;
    }
  }

  async generateResponse(prompt: string, context?: string): Promise<LLMResponse> {
    const maxRetries = 3;
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.provider.generateResponse(prompt, context);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`LLM attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}