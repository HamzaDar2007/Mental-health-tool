import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SessionsService } from '../services/sessions.service';
import { CreateSessionDto, ConsentDto } from '../../../common/dtos/chat.dto';
import { StartSafeModeDto } from '../../../common/dtos/safe-mode.dto';
import { SessionResponseDto, ConsentResponseDto, ErrorResponseDto } from '../../../common/dtos/swagger-responses.dto';
import type { Request } from 'express';

@ApiTags('sessions')
@Controller('api/v1/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create Anonymous Session',
    description: 'Creates a new anonymous session for mental health support. No authentication required. Session includes consent tracking and metadata collection for crisis response.'
  })
  @ApiBody({ 
    type: CreateSessionDto,
    description: 'Session creation parameters',
    examples: {
      basic: {
        summary: 'Basic session',
        value: { locale: 'en' }
      },
      withAge: {
        summary: 'Session with age range',
        value: { locale: 'en', ageRange: '18-25' }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Session created successfully',
    type: SessionResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request parameters',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Rate limit exceeded',
    type: ErrorResponseDto
  })
  async createSession(@Body() createSessionDto: CreateSessionDto, @Req() req: Request) {
    const metadata = {
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      ip_country: req.headers['cf-ipcountry'] || 'US' // Cloudflare header or default
    };

    const session = await this.sessionsService.createSession(createSessionDto, metadata);
    
    return {
      sessionId: session.id,
      message: 'Session created successfully'
    };
  }

  @Post('consent')
  @ApiOperation({ 
    summary: 'Record User Consent',
    description: 'Records user consent for mental health support services. Required before accessing chat functionality. Consent is tracked for compliance and safety protocols.'
  })
  @ApiBody({ 
    type: ConsentDto,
    description: 'User consent information',
    examples: {
      accept: {
        summary: 'Accept consent',
        value: { sessionId: '123e4567-e89b-12d3-a456-426614174000', consented: true }
      },
      decline: {
        summary: 'Decline consent',
        value: { sessionId: '123e4567-e89b-12d3-a456-426614174000', consented: false }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Consent recorded successfully',
    type: ConsentResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid session ID or consent data',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found',
    type: ErrorResponseDto
  })
  async recordConsent(@Body() consentDto: ConsentDto) {
    const session = await this.sessionsService.updateConsent(consentDto);
    
    return {
      message: 'Consent recorded successfully',
      consented: session.consented
    };
  }

  @Get(':sessionId/stats')
  @ApiOperation({ 
    summary: 'Get Session Statistics',
    description: 'Retrieves comprehensive statistics for a session including message count, duration, safe mode status, and crisis indicators.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messageCount: { type: 'number', example: 15 },
        duration: { type: 'number', example: 1800 },
        safeMode: { type: 'boolean', example: false },
        safeModeTimeLeft: { type: 'number', example: 0 },
        crisisDetected: { type: 'boolean', example: false },
        lastActivity: { type: 'string', example: '2024-01-01T12:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found',
    type: ErrorResponseDto
  })
  async getSessionStats(@Param('sessionId') sessionId: string) {
    return await this.sessionsService.getSessionStats(sessionId);
  }
}