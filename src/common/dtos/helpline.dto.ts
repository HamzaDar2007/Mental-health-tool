import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { HelplineType } from '../../modules/helplines/entities/helpline.entity';

export class CreateHelplineDto {
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsString()
  description: string;

  @IsString()
  phone: string;

  @IsEnum(HelplineType)
  type: HelplineType;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetHelplinesDto {
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(HelplineType)
  type?: HelplineType;
}