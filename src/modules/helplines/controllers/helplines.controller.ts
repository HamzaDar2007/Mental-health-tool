import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HelplinesService } from '../services/helplines.service';
import { CreateHelplineDto, GetHelplinesDto } from '../../../common/dtos/helpline.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('helplines')
@Controller('api/v1/helplines')
@UseGuards(ThrottlerGuard)
export class HelplinesController {
  constructor(private readonly helplinesService: HelplinesService) {}

  @Get()
  @ApiOperation({ summary: 'Get helplines by country' })
  @ApiResponse({ status: 200, description: 'Helplines retrieved successfully' })
  async getHelplines(@Query() query: GetHelplinesDto) {
    const helplines = await this.helplinesService.findByCountry(query);
    
    return {
      helplines: helplines.map(h => ({
        id: h.id,
        description: h.description,
        phone: h.phone,
        type: h.type,
        metadata: h.metadata
      }))
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new helpline (Admin)' })
  @ApiResponse({ status: 201, description: 'Helpline created successfully' })
  async createHelpline(@Body() createHelplineDto: CreateHelplineDto) {
    // Note: In production, this should be protected with admin authentication
    const helpline = await this.helplinesService.create(createHelplineDto);
    
    return {
      message: 'Helpline created successfully',
      helpline: {
        id: helpline.id,
        description: helpline.description,
        phone: helpline.phone,
        type: helpline.type
      }
    };
  }
}