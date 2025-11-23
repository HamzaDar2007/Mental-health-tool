import { Injectable } from '@nestjs/common';
import { HelplinesService } from '../../helplines/services/helplines.service';
import { TechniquesService } from '../../techniques/services/techniques.service';
import { ReviewService } from '../../review/services/review.service';

@Injectable()
export class AdminService {
  constructor(
    private helplinesService: HelplinesService,
    private techniquesService: TechniquesService,
    private reviewService: ReviewService,
  ) {}

  async getSystemMetrics() {
    const reviewStats = await this.reviewService.getReviewStats();
    
    return {
      timestamp: new Date().toISOString(),
      review: reviewStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
      },
    };
  }

  async getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        llm: 'available',
        crisis_detection: 'active',
        review_queue: 'operational',
      },
    };
  }

  async seedDefaultData() {
    await this.helplinesService.seedDefaultHelplines();
    await this.techniquesService.seedDefaultTechniques();
    
    return {
      message: 'Default data seeded successfully',
      timestamp: new Date().toISOString(),
    };
  }
}