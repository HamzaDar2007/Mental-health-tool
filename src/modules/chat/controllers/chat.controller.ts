import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { SessionsService } from '../../sessions/services/sessions.service';
import { ChatMessageDto } from '../../../common/dtos/chat.dto';
import { StartSafeModeDto } from '../../../common/dtos/safe-mode.dto';
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
  @ApiOperation({ summary: 'Send chat message' })
  @ApiResponse({ status: 200, description: 'Chat response generated' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async chat(@Body() chatMessageDto: ChatMessageDto, @Req() req: Request) {
    const ipAddress = req.ip;
    return await this.chatService.handleMessage(chatMessageDto, ipAddress);
  }
}

@ApiTags('chat')
@Controller('api/v1/safe-mode')
@UseGuards(ThrottlerGuard)
export class SafeModeController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start safe conversation mode' })
  @ApiResponse({ status: 200, description: 'Safe mode started' })
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
  @ApiOperation({ summary: 'End safe conversation mode' })
  @ApiResponse({ status: 200, description: 'Safe mode ended' })
  async endSafeMode(@Body() body: { sessionId: string }) {
    await this.sessionsService.endSafeMode(body.sessionId);
    
    return {
      message: 'Safe mode ended'
    };
  }
}