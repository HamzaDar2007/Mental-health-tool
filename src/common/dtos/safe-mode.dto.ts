import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class StartSafeModeDto {
  @IsUUID()
  sessionId: string;

  @IsNumber()
  @Min(5)
  @Max(60)
  durationMinutes: number;
}