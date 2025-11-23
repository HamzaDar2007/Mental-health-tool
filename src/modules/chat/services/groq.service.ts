import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GroqProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL = 'https://api.groq.com/openai/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    this.model = this.configService.get<string>('GROQ_MODEL', 'llama3-8b-8192');
  }

  async generateResponse(messages: any[], safeMode: boolean = false): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    try {
      const systemPrompt = safeMode 
        ? "You are a compassionate mental health first aid assistant in safe mode. Provide gentle, supportive responses focused on immediate comfort and basic coping strategies. Avoid any potentially triggering content."
        : "You are a mental health first aid assistant. Provide supportive, empathetic responses while being clear you're not a replacement for professional therapy. Focus on immediate support and coping strategies.";

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return response.data.choices[0]?.message?.content || 'I understand you need support. Please consider reaching out to a mental health professional.';
    } catch (error) {
      this.logger.error('Groq API error:', error.response?.data || error.message);
      throw new Error('Failed to generate response from Groq');
    }
  }
}