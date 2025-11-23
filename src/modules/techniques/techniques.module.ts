import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechniquesController } from './controllers/techniques.controller';
import { TechniquesService } from './services/techniques.service';
import { Technique } from './entities/technique.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Technique])],
  controllers: [TechniquesController],
  providers: [TechniquesService],
  exports: [TechniquesService]
})
export class TechniquesModule {}