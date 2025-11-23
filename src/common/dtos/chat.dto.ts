import { IsString, IsUUID, IsOptional, MaxLength, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ description: 'Session ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'User message', example: 'I am feeling anxious today' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiProperty({ description: 'User locale', example: 'en', required: false })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class CreateSessionDto {
  @ApiProperty({ description: 'User locale', example: 'en', required: false })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({ description: 'Age range', example: '18-25', required: false })
  @IsOptional()
  @IsString()
  ageRange?: string;
}

export class ConsentDto {
  @ApiProperty({ description: 'Session ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'User consent status', example: true })
  @IsBoolean()
  consented: boolean;
}