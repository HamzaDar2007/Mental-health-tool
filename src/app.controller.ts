import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Mental Health First Aid Bot API',
      version: '1.0.0'
    };
  }

  @Get('api/v1/status')
  getStatus() {
    return {
      status: 'operational',
      services: {
        database: 'connected',
        llm: 'available',
        crisis_detection: 'active'
      },
      timestamp: new Date().toISOString()
    };
  }
}
