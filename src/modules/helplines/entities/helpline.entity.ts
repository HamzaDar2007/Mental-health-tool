import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum HelplineType {
  EMERGENCY = 'emergency',
  SUICIDE = 'suicide',
  GENERAL = 'general',
  CHILD = 'child',
  WOMEN = 'women',
  LOCAL_SERVICE = 'local_service'
}

@Entity('helplines')
export class Helpline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'country_code', length: 2 })
  country: string;

  @Column({ nullable: true })
  region: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  phone: string;

  @Column({ type: 'enum', enum: HelplineType })
  type: HelplineType;

  @Column({ default: 1 })
  priority: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  active: boolean;
}