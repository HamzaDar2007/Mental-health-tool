import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ChatModule } from './modules/chat/chat.module';
import { HelplinesModule } from './modules/helplines/helplines.module';
import { TechniquesModule } from './modules/techniques/techniques.module';
import { ReviewModule } from './modules/review/review.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SeedService } from './jobs/seed.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService)
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000, // 1 minute
            limit: configService.get('RATE_LIMIT_PER_MIN', 60)
          }
        ]
      })
    }),
    
    // Scheduling for cleanup tasks
    ScheduleModule.forRoot(),
    
    // Feature modules
    SessionsModule,
    ChatModule,
    HelplinesModule,
    TechniquesModule,
    ReviewModule,
    AuthModule,
    AdminModule
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
