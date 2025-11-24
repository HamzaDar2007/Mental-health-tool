import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndSafeModeDto {
  @ApiProperty({ 
    description: 'Session ID to end safe mode for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @IsUUID()
  sessionId: string;
}