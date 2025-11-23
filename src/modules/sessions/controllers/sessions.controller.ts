import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionsService } from '../services/sessions.service';
import { CreateSessionDto, ConsentDto } from '../../../common/dtos/chat.dto';
import { StartSafeModeDto } from '../../../common/dtos/safe-mode.dto';
import type { Request } from 'express';

@ApiTags('sessions')
@Controller('api/v1/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create anonymous session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
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
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({ status: 200, description: 'Consent recorded successfully' })
  async recordConsent(@Body() consentDto: ConsentDto) {
    const session = await this.sessionsService.updateConsent(consentDto);
    
    return {
      message: 'Consent recorded successfully',
      consented: session.consented
    };
  }

  @Get(':sessionId/stats')
  @ApiOperation({ summary: 'Get session statistics' })
  @ApiResponse({ status: 200, description: 'Session statistics retrieved' })
  async getSessionStats(@Param('sessionId') sessionId: string) {
    return await this.sessionsService.getSessionStats(sessionId);
  }
}