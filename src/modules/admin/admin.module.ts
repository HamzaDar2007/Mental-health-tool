import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { HelplinesModule } from '../helplines/helplines.module';
import { TechniquesModule } from '../techniques/techniques.module';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [HelplinesModule, TechniquesModule, ReviewModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}