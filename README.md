# Mental Health First Aid Bot - Backend API

A NestJS-based backend API for providing mental health first aid support through AI-powered conversations with crisis detection and safety protocols.

## Features

- 🤖 **AI-Powered Chat**: Integration with multiple LLM providers (Gemini, OpenRouter)
- 🚨 **Crisis Detection**: Real-time crisis detection with keyword matching and context analysis
- 📞 **Emergency Helplines**: Localized helpline database with country/region support
- 🧘 **Grounding Techniques**: Built-in breathing and mindfulness exercises
- 👥 **Human Review Queue**: Crisis escalation to human moderators
- 🔒 **Safety First**: Multiple layers of safety checks and content sanitization
- 📊 **Monitoring**: Comprehensive logging, metrics, and health checks
- 🌍 **Internationalization**: Multi-language support with localized content

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Cache/Sessions**: Redis
- **LLM Providers**: Google Gemini, OpenRouter
- **Monitoring**: Sentry, Prometheus
- **Security**: Helmet, Rate limiting, Input validation

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Environment Setup

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mental_health_db

# LLM Provider (choose one)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
# OR
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### Installation & Running

#### Option 1: Docker Compose (Recommended)

```bash
# Install dependencies
npm install

# Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# View logs
docker-compose logs -f api
```

#### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis locally
# Then run the API
npm run start:dev
```

### Database Setup

The application will automatically:
- Run migrations on startup
- Seed default helplines and techniques (in development mode)

For manual database setup:
```bash
# Connect to PostgreSQL and run
psql -U postgres -d mental_health_db -f src/db/migrations/001-initial-schema.sql
```

## API Endpoints

### Public Endpoints

- `POST /api/v1/sessions` - Create anonymous session
- `POST /api/v1/consent` - Record user consent
- `POST /api/v1/chat` - Send chat message
- `POST /api/v1/safe-mode/start` - Start safe conversation mode
- `GET /api/v1/helplines?country=US` - Get helplines by country
- `GET /api/v1/techniques?locale=en` - Get grounding techniques

### Admin Endpoints

- `GET /api/v1/review/queue` - Human review queue
- `POST /api/v1/review/:id/resolve` - Resolve review item
- `GET /api/v1/review/stats` - Review statistics

### Health & Monitoring

- `GET /health` - Health check
- `GET /api/v1/status` - Service status

## Crisis Detection

The system uses multiple layers for crisis detection:

1. **Keyword Matching**: Fast detection of explicit crisis language
2. **Context Analysis**: Analyzes conversation history for patterns
3. **Confidence Scoring**: Weighted scoring system for risk assessment
4. **Human Review**: Automatic escalation for high-risk conversations

### Crisis Keywords (Examples)
- "kill myself", "want to die", "suicide plan"
- "end my life", "going to overdose"
- "no reason to live", "better off dead"

## Safety Protocols

- **Immediate Response**: Crisis messages trigger immediate helpline display
- **Content Sanitization**: All LLM responses are sanitized for harmful content
- **Rate Limiting**: Prevents abuse and ensures service availability
- **Audit Logging**: All interactions are logged for review and improvement
- **Fail-Safe Responses**: Fallback responses when AI services are unavailable

## Configuration

### LLM Providers

#### Gemini (Google)
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-api-key
```

#### OpenRouter
```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-api-key
```

### Rate Limiting
```env
RATE_LIMIT_PER_MIN=60
RATE_LIMIT_PER_HOUR=1000
```

### Crisis Detection Sensitivity
Adjust in `crisis-detector.service.ts`:
- Crisis threshold: 0.85
- Review threshold: 0.8
- Concern threshold: 0.4

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Test crisis detection specifically
npm run test -- --testNamePattern="CrisisDetectorService"
```

## Deployment

### Production Build
```bash
npm run build
npm run start:prod
```

### Docker Production
```bash
docker build -t mental-health-api .
docker run -p 3000:3000 mental-health-api
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SENTRY_DSN=your-sentry-dsn
FRONTEND_URL=https://your-frontend-domain.com
```

## Monitoring & Observability

- **Health Checks**: `/health` endpoint for uptime monitoring
- **Metrics**: Prometheus metrics on `/metrics`
- **Error Tracking**: Sentry integration for error monitoring
- **Audit Logs**: All user interactions and system events logged

## Security Considerations

- **No PII Storage**: Minimal user data collection
- **Session-Based**: Anonymous sessions with optional user accounts
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: Protection against abuse
- **HTTPS Only**: TLS encryption required in production
- **Content Security**: Multiple layers of content filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Clinical Governance

- All user-facing content requires clinical review
- Crisis detection rules reviewed monthly
- Human moderators trained on mental health first aid
- Regular audits of flagged conversations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical issues, please create an issue in the repository.
For clinical or safety concerns, contact: [clinical-team@example.com]

## Disclaimer

This application provides mental health first aid and crisis support resources. It is not a replacement for professional mental health treatment. In case of emergency, always contact local emergency services.