import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JsonWithCommentsMiddleware } from './common/middleware/json-with-comments.middleware';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  

  
  // CORS configuration
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });
  
  // Global pipes and filters
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false,
    validationError: { target: false }
  }));
  
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Trust proxy for rate limiting
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  
  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mental Health First Aid Bot API')
    .setDescription(`
      ## Mental Health First Aid Bot API
      
      A comprehensive API for providing mental health first aid support with advanced crisis detection, 
      AI-powered responses, and safety protocols. This system is designed to provide immediate support 
      while connecting users with professional resources when needed.
      
      ### Key Features:
      - 🤖 **AI-Powered Chat**: Intelligent responses with crisis detection
      - 🚨 **Crisis Detection**: Real-time analysis with immediate helpline access
      - 🛡️ **Safe Mode**: Gentle conversation mode for vulnerable users
      - 🧘 **Grounding Techniques**: Interactive breathing and mindfulness exercises
      - 📞 **Crisis Helplines**: Location-based emergency resources
      - 👥 **Human Review**: Queue system for high-risk conversations
      - 🌍 **Multi-language**: Support for English and Arabic
      - 📊 **Analytics**: Session tracking and usage statistics
      
      ### Safety Notice:
      This service provides mental health first aid and crisis support. 
      **It is not a replacement for professional treatment.**
      
      ### Rate Limiting:
      - 60 requests per minute per IP
      - Enhanced limits for authenticated users
      
      ### Crisis Response:
      - Automatic detection using ML algorithms
      - Immediate helpline display
      - Human review queue escalation
      - Emergency service integration
    `)
    .setVersion('2.0.0')
    .setContact('Mental Health First Aid Team', 'https://github.com/your-org/mental-health-bot', 'support@mentalhealthbot.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:4003', 'Development Server')
    .addServer('https://api.mentalhealthbot.com', 'Production Server')
    .addTag('sessions', '👤 Session Management')
    .addTag('chat', '💬 Chat & Messaging')
    .addTag('safe-mode', '🛡️ Safe Mode')
    .addTag('feedback', '📝 Feedback')
    .addTag('helplines', '📞 Crisis Helplines')
    .addTag('techniques', '🧘 Grounding Techniques')
    .addTag('review', '👥 Human Review')
    .addTag('admin', '⚙️ Administration')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token for admin endpoints'
    })
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = configService.get('PORT', 4003);
  await app.listen(port);
  
  logger.log(`Mental Health First Aid Bot API running on port ${port}`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
