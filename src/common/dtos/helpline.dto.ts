import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HelplineType } from '../../modules/helplines/entities/helpline.entity';

export class CreateHelplineDto {
  @ApiProperty({ example: 'US', description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'CA', required: false, description: 'State/region code' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: 'National Suicide Prevention Lifeline', description: 'Helpline description' })
  @IsString()
  description: string;

  @ApiProperty({ example: '988', description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ enum: HelplineType, example: 'suicide', description: 'Type of helpline' })
  @IsEnum(HelplineType)
  type: HelplineType;

  @ApiProperty({ example: 1, required: false, description: 'Display priority (lower = higher priority)' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ 
    example: { url: 'https://suicidepreventionlifeline.org', hours: '24/7' },
    required: false,
    description: 'Additional metadata (URL, hours, etc.)'
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetHelplinesDto {
  @ApiProperty({ example: 'US', description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'CA', required: false, description: 'State/region code' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ enum: HelplineType, required: false, description: 'Filter by helpline type' })
  @IsOptional()
  @IsEnum(HelplineType)
  type?: HelplineType;
}