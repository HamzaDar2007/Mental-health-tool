import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelplinesController } from './controllers/helplines.controller';
import { HelplinesService } from './services/helplines.service';
import { Helpline } from './entities/helpline.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Helpline])],
  controllers: [HelplinesController],
  providers: [HelplinesService],
  exports: [HelplinesService]
})
export class HelplinesModule {}