import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { SessionsService } from '../../sessions/services/sessions.service';
import { ChatMessageDto } from '../../../common/dtos/chat.dto';
import { StartSafeModeDto } from '../../../common/dtos/safe-mode.dto';
import { EndSafeModeDto } from '../../../common/dtos/end-safe-mode.dto';
import { ChatResponseDto, SafeModeResponseDto, ErrorResponseDto } from '../../../common/dtos/swagger-responses.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

@ApiTags('chat')
@Controller('api/v1/chat')
@UseGuards(ThrottlerGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly sessionsService: SessionsService
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Send Chat Message',
    description: 'AI-powered mental health chat with crisis detection, contextual responses, and safety protocols'
  })
  @ApiBody({ 
    type: ChatMessageDto,
    examples: {
      basic: {
        summary: 'Basic message',
        value: { sessionId: '123e4567-e89b-12d3-a456-426614174000', message: 'I feel anxious', locale: 'en' }
      },
      arabic: {
        summary: 'Arabic message',
        value: { sessionId: '123e4567-e89b-12d3-a456-426614174000', message: 'أشعر بالقلق', locale: 'ar' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Chat response generated', type: ChatResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded', type: ErrorResponseDto })
  async chat(@Body() chatMessageDto: ChatMessageDto, @Req() req: Request) {
    const ipAddress = req.ip;
    return await this.chatService.handleMessage(chatMessageDto, ipAddress);
  }
}

@ApiTags('safe-mode')
@Controller('api/v1/safe-mode')
@UseGuards(ThrottlerGuard)
export class SafeModeController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  @ApiOperation({ 
    summary: 'Start Safe Mode',
    description: 'Activates gentle conversation mode for vulnerable users with enhanced safety protocols'
  })
  @ApiBody({ 
    type: StartSafeModeDto,
    examples: {
      standard: {
        summary: 'Standard 30-minute session',
        value: { sessionId: '123e4567-e89b-12d3-a456-426614174000', durationMinutes: 30 }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Safe mode started', type: SafeModeResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid duration (5-60 minutes)', type: ErrorResponseDto })
  async startSafeMode(@Body() startSafeModeDto: StartSafeModeDto) {
    const session = await this.sessionsService.startSafeMode(
      startSafeModeDto.sessionId,
      startSafeModeDto.durationMinutes
    );

    return {
      message: 'Safe mode started',
      expiresAt: session.safeModeExpires,
      durationMinutes: startSafeModeDto.durationMinutes
    };
  }

  @Post('end')
  @ApiOperation({ 
    summary: 'End Safe Mode',
    description: 'Manually ends safe conversation mode for a session'
  })
  @ApiBody({ type: EndSafeModeDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Safe mode ended',
    schema: { type: 'object', properties: { message: { type: 'string', example: 'Safe mode ended' } } }
  })
  @ApiResponse({ status: 404, description: 'Session not found', type: ErrorResponseDto })
  async endSafeMode(@Body() endSafeModeDto: EndSafeModeDto) {
    await this.sessionsService.endSafeMode(endSafeModeDto.sessionId);
    
    return {
      message: 'Safe mode ended'
    };
  }
}