import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { HelplinesService } from '../services/helplines.service';
import { CreateHelplineDto, GetHelplinesDto } from '../../../common/dtos/helpline.dto';
import { HelplinesResponseDto, ErrorResponseDto } from '../../../common/dtos/swagger-responses.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('helplines')
@Controller('api/v1/helplines')
@UseGuards(ThrottlerGuard)
export class HelplinesController {
  constructor(private readonly helplinesService: HelplinesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get Crisis Helplines',
    description: 'Retrieves crisis helplines filtered by country, region, and type. Used for emergency situations and crisis support.'
  })
  @ApiQuery({ name: 'country', required: true, example: 'US', description: 'Country code (ISO 3166-1 alpha-2)' })
  @ApiQuery({ name: 'region', required: false, example: 'CA', description: 'State/region code' })
  @ApiQuery({ name: 'type', required: false, enum: ['emergency', 'suicide', 'general', 'child', 'women', 'local_service'], description: 'Helpline type filter' })
  @ApiResponse({ 
    status: 200, 
    description: 'Helplines retrieved successfully',
    type: HelplinesResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid country code', type: ErrorResponseDto })
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
  @ApiOperation({ 
    summary: 'Create Helpline (Admin)',
    description: 'Creates a new crisis helpline entry. Requires admin authentication in production.'
  })
  @ApiBody({ 
    type: CreateHelplineDto,
    examples: {
      suicide_hotline: {
        summary: 'Suicide Prevention Hotline',
        value: {
          description: 'National Suicide Prevention Lifeline',
          phone: '988',
          country: 'US',
          type: 'suicide',
          metadata: { url: 'https://suicidepreventionlifeline.org', hours: '24/7' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Helpline created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Helpline created successfully' },
        helpline: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            description: { type: 'string' },
            phone: { type: 'string' },
            type: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid helpline data', type: ErrorResponseDto })
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