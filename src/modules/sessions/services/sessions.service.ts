import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { CreateSessionDto, ConsentDto } from '../../../common/dtos/chat.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async createSession(createSessionDto: CreateSessionDto, metadata?: Record<string, any>): Promise<Session> {
    let user: User | null = null;

    // Create anonymous user if needed
    if (createSessionDto.locale || createSessionDto.ageRange) {
      user = this.userRepository.create({
        locale: createSessionDto.locale,
        ageRange: createSessionDto.ageRange,
        consented: false
      });
      user = await this.userRepository.save(user);
    }

    const session = this.sessionRepository.create({
      userId: user?.id,
      consented: false,
      metadata: metadata || {},
      safeMode: false
    });

    return await this.sessionRepository.save(session);
  }

  async findSession(sessionId: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'messages']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async updateConsent(consentDto: ConsentDto): Promise<Session> {
    const session = await this.findSession(consentDto.sessionId);
    
    session.consented = consentDto.consented;
    
    if (session.user) {
      session.user.consented = consentDto.consented;
      await this.userRepository.save(session.user);
    }

    return await this.sessionRepository.save(session);
  }

  async startSafeMode(sessionId: string, durationMinutes: number): Promise<Session> {
    const session = await this.findSession(sessionId);
    
    session.safeMode = true;
    session.safeModeExpires = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    return await this.sessionRepository.save(session);
  }

  async endSafeMode(sessionId: string): Promise<Session> {
    const session = await this.findSession(sessionId);
    
    session.safeMode = false;
    session.safeModeExpires = undefined;
    
    return await this.sessionRepository.save(session);
  }

  async updateLastActivity(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastActivity: new Date()
    });
  }

  async isSafeModeActive(sessionId: string): Promise<boolean> {
    const session = await this.findSession(sessionId);
    
    if (!session.safeMode || !session.safeModeExpires) {
      return false;
    }

    if (session.safeModeExpires < new Date()) {
      await this.endSafeMode(sessionId);
      return false;
    }

    return true;
  }

  async getSessionStats(sessionId: string): Promise<{
    messageCount: number;
    duration: number;
    safeMode: boolean;
    safeModeTimeLeft?: number;
  }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['messages']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const duration = Date.now() - session.createdAt.getTime();
    let safeModeTimeLeft: number | undefined;

    if (session.safeMode && session.safeModeExpires) {
      safeModeTimeLeft = Math.max(0, session.safeModeExpires.getTime() - Date.now());
    }

    return {
      messageCount: session.messages?.length || 0,
      duration: Math.floor(duration / 1000), // seconds
      safeMode: session.safeMode,
      safeModeTimeLeft
    };
  }
}