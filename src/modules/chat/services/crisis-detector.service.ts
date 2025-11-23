import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CrisisDetectionResult {
  isCrisis: boolean;
  confidence: number;
  keywords: string[];
  label: 'safe' | 'concern' | 'crisis';
  requiresReview: boolean;
}

@Injectable()
export class CrisisDetectorService {
  private readonly logger = new Logger(CrisisDetectorService.name);
  private readonly crisisThreshold: number;

  constructor(private configService: ConfigService) {
    this.crisisThreshold = this.configService.get('CRISIS_CONFIDENCE_THRESHOLD', 0.8);
  }

  private readonly crisisKeywords = [
    'kill myself', 'want to die', 'suicide plan', 'end my life', 'i will end it',
    'going to kill myself', 'want to hurt myself', 'going to overdose',
    'feel like ending it', 'no reason to live', 'i will jump', 'want to die',
    'planning to die', 'ready to die', 'suicide', 'kill me', 'end it all'
  ];

  private readonly concernKeywords = [
    'depressed', 'hopeless', 'worthless', 'can\'t go on', 'give up',
    'nothing matters', 'tired of living', 'better off dead', 'burden',
    'hate myself', 'want to disappear', 'can\'t take it', 'overwhelming'
  ];

  async detectCrisis(message: string, conversationHistory?: string[]): Promise<CrisisDetectionResult> {
    const normalizedMessage = message.toLowerCase().trim();
    
    const crisisMatches = this.findKeywordMatches(normalizedMessage, this.crisisKeywords);
    const concernMatches = this.findKeywordMatches(normalizedMessage, this.concernKeywords);

    let result: CrisisDetectionResult = {
      isCrisis: false,
      confidence: 0,
      keywords: [...crisisMatches, ...concernMatches],
      label: 'safe',
      requiresReview: false
    };

    if (crisisMatches.length > 0) {
      result.isCrisis = true;
      result.confidence = Math.min(0.9 + (crisisMatches.length * 0.05), 1.0);
      result.label = 'crisis';
      result.requiresReview = true;
    } else if (concernMatches.length >= 2) {
      result.confidence = 0.7 + (concernMatches.length * 0.1);
      result.label = 'concern';
      result.requiresReview = result.confidence > this.crisisThreshold;
      result.isCrisis = result.confidence > this.crisisThreshold;
    } else if (concernMatches.length === 1) {
      result.confidence = 0.4;
      result.label = 'concern';
    }

    if (conversationHistory && conversationHistory.length > 0) {
      const contextScore = this.analyzeContext(conversationHistory);
      result.confidence = Math.min(result.confidence + contextScore, 1.0);
      
      if (result.confidence > this.crisisThreshold && result.label === 'concern') {
        result.isCrisis = true;
        result.label = 'crisis';
        result.requiresReview = true;
      }
    }

    this.logger.log(`Crisis detection: ${result.label} (confidence: ${result.confidence})`);
    
    return result;
  }

  private findKeywordMatches(message: string, keywords: string[]): string[] {
    return keywords.filter(keyword => message.includes(keyword));
  }

  private analyzeContext(history: string[]): number {
    let contextScore = 0;
    const recentMessages = history.slice(-5);
    
    for (const msg of recentMessages) {
      const concernMatches = this.findKeywordMatches(msg.toLowerCase(), this.concernKeywords);
      contextScore += concernMatches.length * 0.1;
    }
    
    return Math.min(contextScore, 0.3);
  }
}