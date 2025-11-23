import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TechniquesService } from '../services/techniques.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('techniques')
@Controller('api/v1/techniques')
@UseGuards(ThrottlerGuard)
export class TechniquesController {
  constructor(private readonly techniquesService: TechniquesService) {}

  @Get()
  @ApiOperation({ summary: 'Get grounding techniques' })
  @ApiResponse({ status: 200, description: 'Techniques retrieved successfully' })
  async getTechniques(@Query('locale') locale: string = 'en') {
    const techniques = await this.techniquesService.findByLocale(locale);
    
    return {
      techniques: techniques.map(t => ({
        id: t.id,
        key: t.key,
        title: t.title,
        description: t.description,
        category: t.category,
        durationSeconds: t.durationSeconds,
        steps: t.steps
      }))
    };
  }

  @Get('random')
  @ApiOperation({ summary: 'Get random grounding technique' })
  @ApiResponse({ status: 200, description: 'Random technique retrieved' })
  async getRandomTechnique(
    @Query('locale') locale: string = 'en',
    @Query('category') category?: string
  ) {
    const technique = await this.techniquesService.getRandomTechnique(locale, category);
    
    if (!technique) {
      return { technique: null };
    }

    return {
      technique: {
        id: technique.id,
        key: technique.key,
        title: technique.title,
        description: technique.description,
        category: technique.category,
        durationSeconds: technique.durationSeconds,
        steps: technique.steps
      }
    };
  }
}