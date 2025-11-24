import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique session identifier'
  })
  sessionId: string;

  @ApiProperty({ 
    example: 'Session created successfully',
    description: 'Success message'
  })
  message: string;
}

export class ConsentResponseDto {
  @ApiProperty({ 
    example: 'Consent recorded successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({ 
    example: true,
    description: 'User consent status'
  })
  consented: boolean;
}

export class ChatResponseDto {
  @ApiProperty({ 
    example: 'I understand you\'re going through a difficult time. Would you like to try a breathing exercise?',
    description: 'AI-generated response message'
  })
  message: string;

  @ApiProperty({ 
    example: false,
    description: 'Whether crisis was detected in the conversation'
  })
  isCrisis: boolean;

  @ApiProperty({ 
    type: 'array',
    items: { type: 'object' },
    required: false,
    description: 'Crisis helplines (only included if crisis detected)'
  })
  helplines?: any[];

  @ApiProperty({ 
    type: 'array',
    items: { type: 'object' },
    required: false,
    description: 'Suggested grounding techniques'
  })
  techniques?: any[];

  @ApiProperty({ 
    type: 'object',
    required: false,
    description: 'Session statistics and metadata'
  })
  sessionStats?: any;

  @ApiProperty({ 
    example: false,
    required: false,
    description: 'Whether conversation requires human review'
  })
  requiresReview?: boolean;
}

export class SafeModeResponseDto {
  @ApiProperty({ 
    example: 'Safe mode started',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({ 
    example: '2024-01-01T12:00:00.000Z',
    description: 'When safe mode expires'
  })
  expiresAt: string;

  @ApiProperty({ 
    example: 30,
    description: 'Duration in minutes'
  })
  durationMinutes: number;
}

export class HelplinesResponseDto {
  @ApiProperty({ 
    type: 'array',
    items: { type: 'object' },
    description: 'List of available helplines'
  })
  helplines: any[];
}

export class TechniquesResponseDto {
  @ApiProperty({ 
    type: 'array',
    items: { type: 'object' },
    description: 'List of grounding techniques'
  })
  techniques: any[];
}

export class RandomTechniqueResponseDto {
  @ApiProperty({ 
    type: 'object',
    nullable: true,
    description: 'Random technique or null if none available'
  })
  technique: any | null;
}

export class ErrorResponseDto {
  @ApiProperty({ 
    example: 400,
    description: 'HTTP status code'
  })
  statusCode: number;

  @ApiProperty({ 
    example: 'Validation failed',
    description: 'Error message'
  })
  message: string;

  @ApiProperty({ 
    example: '2024-01-01T12:00:00.000Z',
    description: 'Error timestamp'
  })
  timestamp: string;

  @ApiProperty({ 
    example: '/api/v1/chat',
    description: 'Request path where error occurred'
  })
  path: string;
}

export class AdminMetricsResponseDto {
  @ApiProperty({ 
    example: '2024-01-01T12:00:00.000Z',
    description: 'Metrics timestamp'
  })
  timestamp: string;

  @ApiProperty({ 
    type: 'object',
    description: 'Review queue statistics'
  })
  review: any;

  @ApiProperty({ 
    type: 'object',
    description: 'System performance metrics'
  })
  system: {
    uptime: number;
    memory: any;
    version: string;
  };
}

export class HealthResponseDto {
  @ApiProperty({ 
    example: 'healthy',
    description: 'Overall system health status'
  })
  status: string;

  @ApiProperty({ 
    example: '2024-01-01T12:00:00.000Z',
    description: 'Health check timestamp'
  })
  timestamp: string;

  @ApiProperty({ 
    type: 'object',
    description: 'Individual service statuses'
  })
  services: {
    database: string;
    llm: string;
    crisis_detection: string;
    review_queue: string;
  };
}