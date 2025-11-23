import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Session } from './session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_seen' })
  lastSeen: Date;

  @Column({ default: false })
  consented: boolean;

  @Column({ nullable: true })
  locale: string;

  @Column({ name: 'age_range', nullable: true })
  ageRange: string;

  @OneToMany(() => Session, session => session.user)
  sessions: Session[];
}