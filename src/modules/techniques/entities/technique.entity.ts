import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('techniques')
export class Technique {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  title: string;

  @Column({ default: 'en' })
  locale: string;

  @Column({ type: 'text', array: true })
  steps: string[];

  @Column({ name: 'duration_seconds' })
  durationSeconds: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;
}