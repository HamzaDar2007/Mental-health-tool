import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReviewService } from '../services/review.service';
import { ReviewStatus } from '../entities/human-review-queue.entity';

@ApiTags('review')
@Controller('api/v1/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get human review queue' })
  @ApiResponse({ status: 200, description: 'Review queue retrieved' })
  async getReviewQueue(
    @Query('status') status?: ReviewStatus,
    @Query('assignedTo') assignedTo?: string
  ) {
    const queue = await this.reviewService.getReviewQueue(status, assignedTo);
    
    return {
      queue: queue.map(item => ({
        id: item.id,
        sessionId: item.sessionId,
        messageId: item.messageId,
        status: item.status,
        crisisLevel: item.crisisLevel,
        createdAt: item.createdAt,
        assignedTo: item.assignedTo,
        metadata: item.metadata
      }))
    };
  }

  @Post(':id/assign')
  async assignReview(
    @Param('id') reviewId: string,
    @Body() body: { assignedTo: string }
  ) {
    const review = await this.reviewService.assignReview(reviewId, body.assignedTo);
    
    return {
      message: 'Review assigned successfully',
      review: {
        id: review.id,
        status: review.status,
        assignedTo: review.assignedTo
      }
    };
  }

  @Post(':id/resolve')
  async resolveReview(
    @Param('id') reviewId: string,
    @Body() body: { notes?: string; resolvedBy?: string }
  ) {
    const review = await this.reviewService.resolveReview(
      reviewId,
      body.notes,
      body.resolvedBy
    );
    
    return {
      message: 'Review resolved successfully',
      review: {
        id: review.id,
        status: review.status,
        notes: review.notes
      }
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiResponse({ status: 200, description: 'Review statistics retrieved' })
  async getReviewStats() {
    return await this.reviewService.getReviewStats();
  }
}