import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OpenAIProvider } from './openai.service';
import { GroqProvider } from './groq.service';
import { PromptService } from './prompt.service';

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
  private readonly provider: string;

  constructor(
    private configService: ConfigService,
    private geminiProvider: GeminiProvider,
    private openRouterProvider: OpenRouterProvider,
    private openAIProvider: OpenAIProvider,
    private groqProvider: GroqProvider,
    private promptService: PromptService,
  ) {
    this.provider = this.configService.get<string>('LLM_PROVIDER', 'openai');
  }

  async generateResponse(messages: any[], safeMode: boolean = false): Promise<string> {
    const maxRetries = 3;
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        switch (this.provider) {
          case 'openai':
            return await this.openAIProvider.generateResponse(messages, safeMode);
          
          case 'groq':
            return await this.groqProvider.generateResponse(messages, safeMode);
          
          case 'fallback':
            return this.getFallbackResponse(safeMode);
          
          default:
            return this.getFallbackResponse(safeMode);
        }
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`LLM attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    return this.getFallbackResponse(safeMode);
  }

  private getFallbackResponse(safeMode: boolean): string {
    const responses = safeMode ? [
      "I'm here to listen. Take a deep breath with me - in for 4 counts, hold for 4, out for 4.",
      "You're not alone in this. Sometimes talking about what's on your mind can help. What's one small thing that usually brings you comfort?",
      "I understand you're going through something difficult. Would you like to try a simple grounding technique together?",
      "Your feelings are valid. Let's focus on this moment - can you name 3 things you can see around you right now?"
    ] : [
      "I understand you're going through a difficult time. Sometimes it helps to take a few deep breaths. Would you like me to guide you through a simple breathing exercise?",
      "Thank you for reaching out. It takes courage to ask for support. What's been on your mind lately?",
      "I'm here to provide support and guidance. Remember, if you're in crisis, please contact emergency services or a crisis helpline immediately.",
      "I hear that you need someone to talk to. While I can offer support, please consider speaking with a mental health professional for ongoing care."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}