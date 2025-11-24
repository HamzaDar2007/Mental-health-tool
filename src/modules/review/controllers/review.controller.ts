import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ReviewService } from '../services/review.service';
import { ReviewStatus } from '../entities/human-review-queue.entity';

@ApiTags('review')
@Controller('api/v1/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('queue')
  @ApiOperation({ 
    summary: 'Get Human Review Queue',
    description: 'Retrieves items from the human review queue with optional filtering by status and assigned user'
  })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus, description: 'Filter by review status' })
  @ApiQuery({ name: 'assignedTo', required: false, description: 'Filter by assigned user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review queue retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        queue: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              sessionId: { type: 'string' },
              messageId: { type: 'string', nullable: true },
              status: { type: 'string', enum: ['pending', 'reviewing', 'resolved'] },
              crisisLevel: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              assignedTo: { type: 'string', nullable: true },
              metadata: { type: 'object' }
            }
          }
        }
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Assign Review Item',
    description: 'Assigns a review item to a specific user for processing'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Review assigned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Review assigned successfully' },
        review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', example: 'reviewing' },
            assignedTo: { type: 'string' }
          }
        }
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Resolve Review Item',
    description: 'Marks a review item as resolved with optional notes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Review resolved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Review resolved successfully' },
        review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', example: 'resolved' },
            notes: { type: 'string', nullable: true }
          }
        }
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Get Review Statistics',
    description: 'Retrieves statistics about the review queue including counts by status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Review statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        pending: { type: 'number', example: 5 },
        reviewing: { type: 'number', example: 2 },
        resolved: { type: 'number', example: 10 },
        highPriority: { type: 'number', example: 1 }
      }
    }
  })
  async getReviewStats() {
    return await this.reviewService.getReviewStats();
  }

  @Post('test-data')
  @ApiOperation({ 
    summary: 'Create Test Review Data',
    description: 'Creates test data for development and testing purposes. Generates a sample review queue item with high crisis level.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Test data created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Test data created' },
        review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sessionId: { type: 'string', example: 'test-session' },
            messageId: { type: 'string', example: 'test-message' },
            status: { type: 'string', example: 'pending' },
            crisisLevel: { type: 'number', example: 8 },
            createdAt: { type: 'string', format: 'date-time' },
            metadata: { type: 'object', example: { test: true } }
          }
        }
      }
    }
  })
  async createTestData() {
    const review = await this.reviewService.createReviewItem({
      sessionId: 'test-session',
      messageId: 'test-message',
      crisisLevel: 8,
      metadata: { test: true }
    });
    return { message: 'Test data created', review };
  }
}