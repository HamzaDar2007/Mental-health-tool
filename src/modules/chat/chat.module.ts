import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController, SafeModeController } from './controllers/chat.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { ChatService } from './services/chat.service';
import { CrisisDetectorService } from './services/crisis-detector.service';
import { LlmService, GeminiProvider, OpenRouterProvider } from './services/llm.service';
import { OpenAIProvider } from './services/openai.service';
import { PromptService } from './services/prompt.service';
import { Message } from './entities/message.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { HelplinesModule } from '../helplines/helplines.module';
import { TechniquesModule } from '../techniques/techniques.module';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    SessionsModule,
    HelplinesModule,
    TechniquesModule,
    ReviewModule
  ],
  controllers: [ChatController, SafeModeController, FeedbackController],
  providers: [
    ChatService,
    CrisisDetectorService,
    LlmService,
    GeminiProvider,
    OpenRouterProvider,
    OpenAIProvider,
    PromptService
  ],
  exports: [ChatService, CrisisDetectorService]
})
export class ChatModule {}