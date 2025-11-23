import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HelplinesService } from '../modules/helplines/services/helplines.service';
import { TechniquesService } from '../modules/techniques/services/techniques.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private helplinesService: HelplinesService,
    private techniquesService: TechniquesService
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development') {
      await this.seedData();
    }
  }

  async seedData() {
    try {
      this.logger.log('Seeding default data...');
      
      await this.helplinesService.seedDefaultHelplines();
      this.logger.log('✓ Helplines seeded');
      
      await this.techniquesService.seedDefaultTechniques();
      this.logger.log('✓ Techniques seeded');
      
      this.logger.log('Data seeding completed successfully');
    } catch (error) {
      this.logger.error('Failed to seed data:', error);
    }
  }
}