# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the AI Web Upgrader - Builder Service, a Node.js Express microservice that generates AI-powered homepage designs based on website analysis results. The service uses OpenAI's API to create modern, responsive HTML/CSS homepages tailored to specific businesses and industries.

## Architecture

The service follows a 3-layer architecture:

1. **API Layer** (`src/main.js`): Express application with REST endpoints
2. **Business Logic** (`src/generator.js`): Core homepage generation and AI integration
3. **Supporting Services** (`src/screenshot.js`, `src/validation.js`): Screenshot generation and request validation

The builder performs this workflow:
1. Receives analysis results and generation preferences via API
2. Uses AI to generate industry-specific homepage HTML/CSS
3. Optionally generates screenshots for preview
4. Returns structured generation results with code and metadata

## Deployment Notes

### Coolify Deployment
When deploying with Coolify:
- Coolify typically sets `PORT=3000` environment variable
- The health check in Dockerfile uses `${PORT:-8002}` to adapt to Coolify's port setting
- Ensure your Coolify configuration sets the required environment variables (especially `OPENAI_API_KEY`)
- Puppeteer dependencies are included for screenshot functionality

### Port Configuration
The service uses the `PORT` environment variable with fallback to 8002:
- Default: 8002 (for local development)
- Coolify: Usually 3000 (set automatically)
- Health check adapts to whatever port is configured

## Common Development Commands

### Development Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run with auto-reload
npm run dev
```

### Docker Operations
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f builder

# Stop services
docker-compose down
```

### Testing
```bash
# Run comprehensive tests
./scripts/test.sh

# Manual API testing
curl http://localhost:8002/health
curl http://localhost:8002/generate/sample
curl -X POST http://localhost:8002/generate -H "Content-Type: application/json" -d @test-data.json
```

### Deployment
```bash
# Deploy service
./scripts/deploy.sh

# Stop service
./scripts/stop.sh
```

## Key Configuration

### Environment Variables
The service requires these environment variables in `.env`:
- `OPENAI_API_KEY`: Required - OpenAI API key
- `OPENAI_BASE_URL`: Optional - Custom LLM server URL
- `OPENAI_MODEL`: Model name (default: gpt-4o-mini)
- `OPENAI_TEMPERATURE`: AI response randomness (default: 0.3)
- `OPENAI_MAX_TOKENS`: Max tokens per response (default: 3000)
- `NODE_ENV`: Environment mode (default: production)
- `PORT`: Service port (default: 8002)

### API Endpoints
- `GET /health`: Health check with system status and memory usage
- `POST /generate`: Main homepage generation endpoint
- `GET /generate/sample`: Sample generation data for testing
- `POST /screenshot`: Generate screenshots of HTML content
- `GET /`: Service information and available endpoints

## Code Structure Guidelines

### Adding New Generation Features
1. Extend `HomepageGenerator` class in `generator.js`
2. Update industry templates in `_getIndustryTemplate` method
3. Add new style preferences in validation schemas
4. Update generation workflow in `generateHomepage` method

### AI Integration Patterns
- Use `_generateHomepageCode()` method for all LLM calls
- Structure prompts with clear business context and requirements
- Always include error handling and fallback responses
- Industry-specific templates guide AI generation for better results

### Screenshot Service
- Puppeteer-based screenshot generation with multiple viewport support
- Graceful degradation if Puppeteer fails to initialize
- Screenshot service runs independently and can be disabled without affecting core functionality

### Validation Patterns
- Use Joi schemas for all request validation
- Sanitize business names and descriptions to prevent injection
- Validate analysis result structure before processing
- Extract safe data for AI prompt construction

## Development Notes

### Puppeteer Configuration
The service includes Puppeteer for screenshot generation with optimized Docker configuration:
- Uses system Chromium in Docker for better compatibility
- Graceful degradation if screenshot service fails
- Multiple viewport support (desktop, tablet, mobile)

### AI Prompt Engineering
The service uses sophisticated prompt engineering:
- Industry-specific template guidance
- Business context integration
- Style preference customization
- Feature requirement specification

### Error Handling Strategy
- Structured error responses with request IDs
- Graceful degradation for non-critical features (screenshots)
- Comprehensive logging with service context
- Health checks include all service dependencies

## Performance Considerations

### Memory Management
- Puppeteer browser instances are properly managed
- Screenshot generation uses isolated pages
- Memory usage monitoring in health checks
- Docker resource limits configured

### AI Token Optimization
- Prompts are structured for efficient token usage
- Response length is limited to prevent excessive costs
- Industry templates reduce prompt size while maintaining quality

### Concurrent Request Handling
- Express.js handles concurrent requests efficiently
- Screenshot service uses separate browser pages
- Database-free design for horizontal scaling

## Security Notes

- API keys are loaded from environment variables
- CORS is configured for development (restrict for production)
- Request validation prevents injection attacks
- Business name sanitization removes harmful characters
- Puppeteer runs with restricted permissions

## Testing Strategy

The test script (`scripts/test.sh`) runs comprehensive tests including:
- Health checks and service availability
- Sample data validation and endpoint testing
- Error handling validation (404, 400 responses)
- Performance testing with concurrent requests
- Screenshot service availability testing

## Monitoring and Logging

- Health endpoint provides system status, uptime, and memory usage
- Structured logging with request context and error details
- Container logs are limited with rotation
- Service includes dependency health checks (OpenAI API, Screenshot service)

## Integration Notes

### With Analyzer Service
- Accepts analysis results from analyzer service
- Validates analysis structure before processing
- Extracts business context for AI generation

### With Orchestrator Service
- Returns structured generation results
- Includes generation metadata and timing
- Supports screenshot generation for previews

## Business Logic

### Industry-Specific Generation
The service includes specialized templates for:
- Home Services (plumbing, HVAC, etc.)
- Healthcare (dental, medical practices)
- Food & Beverage (restaurants, cafes)
- Automotive (repair, dealerships)
- Beauty & Wellness (salons, spas)
- Professional Services (consulting, legal)
- Retail & E-commerce

### Style Preferences
Supported style options:
- Modern: Clean, minimalist design with gradients
- Classic: Traditional, professional appearance
- Bold: High-contrast, attention-grabbing design
- Minimal: Simple, content-focused layout
- Professional: Corporate, trustworthy styling

### Feature Integration
- Responsive design for all viewports
- Call-to-action optimization
- Contact form integration
- Booking system placeholder support
- SEO-friendly markup generation