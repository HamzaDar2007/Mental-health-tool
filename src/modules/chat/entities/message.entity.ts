import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Session } from '../../sessions/entities/session.entity';

export enum MessageRole {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
  HUMAN = 'human'
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ type: 'enum', enum: MessageRole })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ default: false })
  anonymized: boolean;

  @Column({ default: false })
  flagged: boolean;

  @Column({ type: 'jsonb', nullable: true })
  classifier: Record<string, any>;

  @Column({ name: 'crisis_detected', default: false })
  crisisDetected: boolean;

  @ManyToOne(() => Session, session => session.messages)
  @JoinColumn({ name: 'session_id' })
  session: Session;
}