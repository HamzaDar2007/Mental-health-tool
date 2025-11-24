import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HumanReviewQueue, ReviewStatus } from '../entities/human-review-queue.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { CrisisDetectionResult } from '../../chat/services/crisis-detector.service';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(HumanReviewQueue)
    private reviewQueueRepository: Repository<HumanReviewQueue>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  async queueForReview(
    sessionId: string,
    messageId: string | null,
    crisisResult: CrisisDetectionResult,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<HumanReviewQueue> {
    const reviewItem = this.reviewQueueRepository.create({
      sessionId,
      messageId: messageId || undefined,
      status: ReviewStatus.PENDING,
      crisisLevel: this.mapCrisisLevel(crisisResult.label, priority),
      metadata: {
        confidence: crisisResult.confidence,
        keywords: crisisResult.keywords,
        label: crisisResult.label,
        priority
      }
    });

    const saved = await this.reviewQueueRepository.save(reviewItem);

    // Log the review queue event
    await this.logEvent('review_queued', {
      reviewId: saved.id,
      sessionId,
      messageId,
      crisisLevel: saved.crisisLevel,
      priority
    });

    this.logger.warn(`Session ${sessionId} queued for review - Crisis level: ${saved.crisisLevel}`);

    return saved;
  }

  async getReviewQueue(status?: ReviewStatus, assignedTo?: string): Promise<HumanReviewQueue[]> {
    // First, let's get all items to debug
    const allItems = await this.reviewQueueRepository.find();
    this.logger.log(`Total items in queue: ${allItems.length}`);
    
    if (allItems.length === 0) {
      this.logger.warn('No items found in review queue table');
      return [];
    }

    const whereConditions: any = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (assignedTo) {
      whereConditions.assignedTo = assignedTo;
    }

    const filteredItems = await this.reviewQueueRepository.find({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      order: {
        crisisLevel: 'DESC',
        createdAt: 'ASC'
      }
    });
    
    this.logger.log(`Filtered items: ${filteredItems.length}`);
    return filteredItems;
  }

  async assignReview(reviewId: string, assignedTo: string): Promise<HumanReviewQueue> {
    const review = await this.reviewQueueRepository.findOne({ where: { id: reviewId } });
    
    if (!review) {
      throw new Error('Review item not found');
    }

    review.assignedTo = assignedTo;
    review.status = ReviewStatus.REVIEWING;

    const updated = await this.reviewQueueRepository.save(review);

    await this.logEvent('review_assigned', {
      reviewId,
      assignedTo,
      sessionId: review.sessionId
    });

    return updated;
  }

  async resolveReview(reviewId: string, notes?: string, resolvedBy?: string): Promise<HumanReviewQueue> {
    const review = await this.reviewQueueRepository.findOne({ where: { id: reviewId } });
    
    if (!review) {
      throw new Error('Review item not found');
    }

    review.status = ReviewStatus.RESOLVED;
    review.notes = notes;

    const updated = await this.reviewQueueRepository.save(review);

    await this.logEvent('review_resolved', {
      reviewId,
      resolvedBy,
      sessionId: review.sessionId,
      notes
    });

    return updated;
  }

  async getReviewStats(): Promise<{
    pending: number;
    reviewing: number;
    resolved: number;
    highPriority: number;
  }> {
    const [pending, reviewing, resolved, highPriority] = await Promise.all([
      this.reviewQueueRepository.count({ where: { status: ReviewStatus.PENDING } }),
      this.reviewQueueRepository.count({ where: { status: ReviewStatus.REVIEWING } }),
      this.reviewQueueRepository.count({ where: { status: ReviewStatus.RESOLVED } }),
      this.reviewQueueRepository.count({ 
        where: { 
          status: ReviewStatus.PENDING,
          crisisLevel: 3 
        } 
      })
    ]);

    return { pending, reviewing, resolved, highPriority };
  }

  async logEvent(eventType: string, payload: Record<string, any>, userId?: string, sessionId?: string): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      eventType,
      payload,
      userId,
      sessionId
    });

    await this.auditLogRepository.save(auditLog);
  }

  async createReviewItem(data: {
    sessionId: string;
    messageId?: string;
    crisisLevel: number;
    metadata?: Record<string, any>;
  }): Promise<HumanReviewQueue> {
    const reviewItem = this.reviewQueueRepository.create({
      sessionId: data.sessionId,
      messageId: data.messageId,
      status: ReviewStatus.PENDING,
      crisisLevel: data.crisisLevel,
      metadata: data.metadata
    });

    return await this.reviewQueueRepository.save(reviewItem);
  }

  private mapCrisisLevel(label: string, priority: string): number {
    if (priority === 'high' || label === 'crisis') return 3;
    if (priority === 'medium' || label === 'concern') return 2;
    return 1;
  }
}