import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ReviewService } from '../../review/services/review.service';
import { IsString, IsUUID, IsOptional, IsNumber, Min, Max } from 'class-validator';

class FeedbackDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsUUID()
  messageId?: string;

  @IsString()
  type: 'helpful' | 'not_helpful' | 'inappropriate' | 'crisis_missed' | 'other';

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}

@Controller('api/v1/feedback')
@UseGuards(ThrottlerGuard)
export class FeedbackController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async submitFeedback(@Body() feedbackDto: FeedbackDto) {
    // Log feedback for analysis
    await this.reviewService.logEvent('user_feedback', {
      sessionId: feedbackDto.sessionId,
      messageId: feedbackDto.messageId,
      type: feedbackDto.type,
      comment: feedbackDto.comment,
      rating: feedbackDto.rating,
      timestamp: new Date().toISOString()
    });

    // If crisis was missed, queue for immediate review
    if (feedbackDto.type === 'crisis_missed') {
      await this.reviewService.queueForReview(
        feedbackDto.sessionId,
        feedbackDto.messageId || null,
        {
          isCrisis: true,
          confidence: 1.0,
          keywords: ['user_reported_crisis'],
          label: 'crisis',
          requiresReview: true
        },
        'high'
      );
    }

    return {
      message: 'Thank you for your feedback. It helps us improve our service.',
      received: true
    };
  }
}