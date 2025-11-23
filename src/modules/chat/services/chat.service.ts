import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageRole } from '../entities/message.entity';
import { SessionsService } from '../../sessions/services/sessions.service';
import { HelplinesService } from '../../helplines/services/helplines.service';
import { TechniquesService } from '../../techniques/services/techniques.service';
import { CrisisDetectorService } from './crisis-detector.service';
import { LlmService } from './llm.service';
import { PromptService } from './prompt.service';
import { ReviewService } from '../../review/services/review.service';
import { ChatMessageDto } from '../../../common/dtos/chat.dto';

export interface ChatResponse {
  message: string;
  isCrisis: boolean;
  helplines?: any[];
  techniques?: any[];
  sessionStats?: any;
  requiresReview?: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private sessionsService: SessionsService,
    private helplinesService: HelplinesService,
    private techniquesService: TechniquesService,
    private crisisDetectorService: CrisisDetectorService,
    private llmService: LlmService,
    private promptService: PromptService,
    private reviewService: ReviewService
  ) {}

  async handleMessage(chatMessageDto: ChatMessageDto, ipAddress?: string): Promise<ChatResponse> {
    const { sessionId, message, locale = 'en' } = chatMessageDto;

    try {
      // Validate session and consent
      const session = await this.sessionsService.findSession(sessionId);
      
      if (!session.consented) {
        return {
          message: "I'd be happy to help, but I need your consent first. Please review and accept the terms to continue our conversation.",
          isCrisis: false
        };
      }

      // Update last activity
      await this.sessionsService.updateLastActivity(sessionId);

      // Save user message
      const userMessage = await this.saveMessage(sessionId, message, MessageRole.USER);

      // Get conversation history
      const conversationHistory = await this.getConversationHistory(sessionId);
      const historyText = conversationHistory.map(msg => msg.content);

      // Crisis detection
      const crisisResult = await this.crisisDetectorService.detectCrisis(message, historyText);

      // Update message with crisis detection results
      userMessage.classifier = {
        label: crisisResult.label,
        confidence: crisisResult.confidence,
        keywords: crisisResult.keywords
      };
      userMessage.crisisDetected = crisisResult.isCrisis;
      await this.messageRepository.save(userMessage);

      // Handle crisis immediately
      if (crisisResult.isCrisis) {
        return await this.handleCrisisResponse(sessionId, locale, crisisResult);
      }

      // Check if in safe mode
      const isSafeMode = await this.sessionsService.isSafeModeActive(sessionId);

      // Generate response
      const botResponse = await this.generateBotResponse(
        message,
        conversationHistory,
        locale,
        isSafeMode
      );

      // Save bot message
      await this.saveMessage(sessionId, botResponse.message, MessageRole.BOT);

      // Queue for review if needed
      if (crisisResult.requiresReview) {
        await this.reviewService.queueForReview(sessionId, userMessage.id, crisisResult);
      }

      // Get session stats
      const sessionStats = await this.sessionsService.getSessionStats(sessionId);

      return {
        ...botResponse,
        sessionStats,
        requiresReview: crisisResult.requiresReview
      };

    } catch (error) {
      this.logger.error(`Chat error for session ${sessionId}:`, error);
      
      // Fallback response
      return {
        message: "I'm sorry, I'm having trouble right now. If you're in crisis, please contact your local emergency services or a crisis helpline immediately.",
        isCrisis: false
      };
    }
  }

  private async handleCrisisResponse(sessionId: string, locale: string, crisisResult: any): Promise<ChatResponse> {
    // Get crisis helplines
    const session = await this.sessionsService.findSession(sessionId);
    const countryCode = session.metadata?.ip_country || 'US'; // Default to US
    
    const helplines = await this.helplinesService.findCrisisHelplines(countryCode);
    
    // Generate crisis response
    const crisisMessage = this.promptService.buildCrisisResponse(helplines);
    
    // Save crisis response
    await this.saveMessage(sessionId, crisisMessage, MessageRole.BOT);

    // Queue for immediate review
    await this.reviewService.queueForReview(sessionId, null, crisisResult, 'high');

    return {
      message: crisisMessage,
      isCrisis: true,
      helplines: helplines.map(h => ({
        description: h.description,
        phone: h.phone,
        type: h.type,
        metadata: h.metadata
      })),
      requiresReview: true
    };
  }

  private async generateBotResponse(
    userMessage: string,
    conversationHistory: Message[],
    locale: string,
    isSafeMode: boolean
  ): Promise<ChatResponse> {
    try {
      // Get available techniques
      const techniques = await this.techniquesService.findByLocale(locale);
      const randomTechnique = await this.techniquesService.getRandomTechnique(locale);

      let prompt: { systemPrompt: string; userPrompt: string };

      if (isSafeMode) {
        prompt = this.promptService.buildSafeModePrompt(userMessage, conversationHistory);
      } else {
        prompt = this.promptService.buildChatPrompt(userMessage, conversationHistory, techniques);
      }

      // Generate LLM response
      const messages = [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt }
      ];
      
      const llmResponse = await this.llmService.generateResponse(messages, isSafeMode);

      // Sanitize response
      const sanitizedMessage = this.sanitizeResponse(llmResponse);

      return {
        message: sanitizedMessage,
        isCrisis: false,
        techniques: randomTechnique ? [randomTechnique] : []
      };

    } catch (error) {
      this.logger.error('LLM generation error:', error);
      
      // Fallback to canned response
      return {
        message: "I understand you're going through a difficult time. Sometimes it helps to take a few deep breaths. Would you like me to guide you through a simple breathing exercise?",
        isCrisis: false
      };
    }
  }

  private sanitizeResponse(response: string): string {
    // Remove any potentially harmful content
    const harmfulPatterns = [
      /\b(kill|suicide|die|death|harm)\b/gi,
      /\b(diagnosis|prescribe|medication)\b/gi
    ];

    let sanitized = response;
    
    for (const pattern of harmfulPatterns) {
      if (pattern.test(sanitized)) {
        // If harmful content detected, return safe fallback
        return "I want to support you, but I think it would be best to speak with a mental health professional who can provide the right guidance. Would you like me to help you find local resources?";
      }
    }

    return sanitized.trim();
  }

  private async saveMessage(sessionId: string, content: string, role: MessageRole): Promise<Message> {
    const message = this.messageRepository.create({
      sessionId,
      content,
      role,
      anonymized: role === MessageRole.BOT // Bot messages can be anonymized by default
    });

    return await this.messageRepository.save(message);
  }

  private async getConversationHistory(sessionId: string, limit: number = 10): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }
}