# AI Web Upgrader - Builder Service

A Node.js microservice that generates AI-powered homepage designs based on website analysis results.

## Overview

The Builder Service is part of the AI Web Upgrader POC system. It takes analysis results from the Analyzer Service and generates modern, industry-specific homepage designs using OpenAI's API.

## Features

- 🤖 **AI-Powered Generation**: Uses OpenAI to create custom homepage designs
- 🏭 **Industry-Specific Templates**: Tailored designs for different business types
- 📱 **Responsive Design**: Mobile-first, responsive layouts
- 📸 **Screenshot Generation**: Puppeteer-based preview screenshots
- 🎨 **Multiple Style Options**: Modern, classic, minimal, bold, and professional styles
- 🔧 **Booking Integration**: Optional appointment booking functionality
- ✅ **Comprehensive Validation**: Request validation and sanitization

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- OpenAI API key

### Environment Setup

Create a `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
NODE_ENV=development
PORT=8002
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Docker Deployment

```bash
# Quick deployment
./scripts/deploy.sh

# Manual Docker commands
docker-compose up -d

# Check health
curl http://localhost:8002/health
```

## API Endpoints

### Health Check
```http
GET /health
```

Returns service status, uptime, and dependency health.

### Generate Homepage
```http
POST /generate
Content-Type: application/json

{
  "analysis_result": {
    "id": "analysis_123",
    "url": "https://example.com",
    "business_info": {
      "name": "Sample Business",
      "business_type": "restaurant",
      "industry": "food_and_beverage",
      "confidence": 0.9
    },
    "website_content": {},
    "confidence_score": 0.9
  },
  "business_name": "Sample Business",
  "style_preference": "modern",
  "include_booking": false
}
```

### Generate Screenshot
```http
POST /screenshot
Content-Type: application/json

{
  "html_code": "<html>...</html>",
  "css_code": "/* custom styles */",
  "viewport": "desktop",
  "format": "png"
}
```

### Sample Data
```http
GET /generate/sample
```

Returns sample generation data for testing.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | **Required** OpenAI API key |
| `OPENAI_BASE_URL` | - | Custom LLM server URL |
| `OPENAI_MODEL` | `gpt-4o-mini` | AI model for generation |
| `OPENAI_TEMPERATURE` | `0.3` | AI response randomness |
| `OPENAI_MAX_TOKENS` | `3000` | Max tokens per response |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `8002` | Service port |

### Style Preferences

- `modern`: Clean, minimalist with gradients
- `classic`: Traditional, professional
- `minimal`: Simple, content-focused
- `bold`: High-contrast, attention-grabbing
- `professional`: Corporate, trustworthy

### Industry Templates

Specialized designs for:
- Home Services (plumbing, HVAC, etc.)
- Healthcare (dental, medical practices)  
- Food & Beverage (restaurants, cafes)
- Automotive (repair, dealerships)
- Beauty & Wellness (salons, spas)
- Professional Services (consulting, legal)
- Retail & E-commerce

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Integration tests
./scripts/test.sh

# Manual API testing
curl http://localhost:8002/health
curl http://localhost:8002/generate/sample
```

## Directory Structure

```
builder-service/
├── src/
│   ├── main.js           # Express server and API routes
│   ├── generator.js      # Core homepage generation logic
│   ├── screenshot.js     # Puppeteer screenshot service
│   └── validation.js     # Request validation schemas
├── tests/
│   └── generator.test.js # Unit tests
├── scripts/
│   ├── deploy.sh         # Deployment script
│   ├── test.sh          # Integration test script
│   └── stop.sh          # Stop service script
├── docs/                 # Additional documentation
├── output/              # Generated file output
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
├── package.json         # Node.js dependencies
├── CLAUDE.md           # Claude Code guidance
└── README.md           # This file
```

## Development

### Adding New Industry Templates

1. Add industry template in `generator.js`:
```javascript
_getIndustryTemplate(industry, businessType) {
    const templates = {
        'new_industry': `
- Industry-specific requirement 1
- Industry-specific requirement 2
        `,
        // ... existing templates
    };
}
```

2. Add industry colors:
```javascript
_getBaseColors(colorScheme, industry) {
    const industryColors = {
        'new_industry': { 
            primary: '#COLOR1', 
            secondary: '#COLOR2', 
            accent: '#COLOR3' 
        },
        // ... existing colors
    };
}
```

### Adding New Style Preferences

1. Update validation schema in `validation.js`:
```javascript
style_preference: Joi.string()
    .valid('modern', 'classic', 'minimal', 'bold', 'professional', 'new_style')
    .default('modern')
```

2. Add style handling in `generator.js`:
```javascript
_determineFeaturesIncluded({ stylePreference }) {
    if (stylePreference === 'new_style') {
        features.push('new_style_feature');
    }
}
```

## Deployment

### Production Deployment

1. Set up environment:
```bash
cp .env.example .env
# Edit .env with production values
```

2. Deploy with Docker:
```bash
./scripts/deploy.sh
```

3. Verify deployment:
```bash
curl http://localhost:8002/health
```

### Health Monitoring

The service provides comprehensive health checks:
- OpenAI API connectivity
- Generator readiness
- Screenshot service availability
- Memory usage monitoring

## Performance

### Optimization Features

- Efficient AI prompt engineering
- Token usage optimization
- Memory-conscious Puppeteer usage
- Concurrent request handling
- Docker resource limits

### Scaling Considerations

- Stateless design for horizontal scaling
- Independent screenshot service
- Configurable resource limits
- Health check integration

## Security

- Environment variable configuration
- Request validation and sanitization
- Business name injection prevention
- Puppeteer security restrictions
- CORS configuration

## Troubleshooting

### Common Issues

**Screenshots not working:**
- Check Puppeteer dependencies in Docker
- Verify screenshot service initialization
- Check Docker permissions and memory limits

**AI generation errors:**
- Verify OPENAI_API_KEY is set correctly
- Check token limits and model availability
- Review prompt structure and content length

**Service startup failures:**
- Ensure all required environment variables are set
- Check port availability and conflicts
- Verify Node.js version compatibility

### Logs and Debugging

```bash
# View service logs
docker-compose logs -f builder

# Check health status
curl http://localhost:8002/health

# Test with sample data
curl http://localhost:8002/generate/sample
```

## Contributing

1. Follow the existing code structure
2. Add tests for new functionality
3. Update documentation
4. Ensure all tests pass
5. Test Docker deployment

## License

MIT License - see LICENSE file for details.