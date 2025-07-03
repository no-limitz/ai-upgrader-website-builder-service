/**
 * AI Web Upgrader POC - Homepage Builder Service
 * 
 * This service handles:
 * 1. Generating NextJS homepage code based on analysis
 * 2. Creating preview images
 * 3. Optimizing generated code
 * 
 * Express.js service that provides REST endpoints for homepage generation.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { HomepageGenerator } = require('./generator');
const { validateGenerateRequest } = require('./validation');
const ScreenshotService = require('./screenshot');
const { specs, swaggerUi } = require('./swagger');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PORT = parseInt(process.env.PORT || '8002');
const NODE_ENV = process.env.NODE_ENV || 'development';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate required environment variables
if (!OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY environment variable is required');
    process.exit(1);
}

// =============================================================================
// EXPRESS APPLICATION
// =============================================================================

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Initialize homepage generator and screenshot service
const generator = new HomepageGenerator(OPENAI_API_KEY);
const screenshotService = new ScreenshotService();

// Service startup time for uptime calculation
const startupTime = Date.now();

// =============================================================================
// SWAGGER DOCUMENTATION
// =============================================================================

// Swagger UI setup
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AI Web Upgrader - Builder Service API',
    swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true
    }
}));

// =============================================================================
// API ROUTES
// =============================================================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Service health check
 *     description: Returns the current health status of the builder service including dependency checks
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/health', (req, res) => {
    const uptime = (Date.now() - startupTime) / 1000;
    const memoryUsage = process.memoryUsage();
    
    // Perform health checks
    const checks = {
        openai_api: !!OPENAI_API_KEY,
        generator_ready: generator.isReady(),
        screenshot_service_ready: screenshotService.isReady(),
        memory_usage: true
    };
    
    const status = Object.values(checks).every(check => check) ? 'healthy' : 'unhealthy';
    
    res.json({
        status,
        version: '1.0.0',
        uptime: uptime,
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        },
        checks,
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /generate:
 *   post:
 *     summary: Generate homepage based on website analysis
 *     description: Creates a modern, responsive homepage based on analysis results and business requirements
 *     tags: [Homepage Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateHomepageRequest'
 *           example:
 *             analysis_result:
 *               business_type: "restaurant"
 *               industry: "food-service"
 *               current_issues: ["Poor mobile responsiveness", "Missing contact information"]
 *               recommendations: ["Add mobile-responsive design", "Include clear contact form"]
 *               target_keywords: ["local restaurant", "italian cuisine"]
 *               confidence_score: 0.89
 *             business_name: "Mario's Italian Restaurant"
 *             style_preference: "modern"
 *             additional_requirements: "Include online reservation system"
 *     responses:
 *       200:
 *         description: Homepage generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HomepageResult'
 *                 message:
 *                   type: string
 *                   example: "Homepage generated successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/generate', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate request
        const { error, value } = validateGenerateRequest(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: error.details[0].message,
                timestamp: new Date().toISOString()
            });
        }
        
        const {
            analysis_result,
            business_name,
            style_preference = 'modern',
            include_booking = false,
            color_scheme = null
        } = value;
        
        console.log(`Generating homepage for ${business_name}`);
        
        // Generate homepage
        const result = await generator.generateHomepage({
            analysisResult: analysis_result,
            businessName: business_name,
            stylePreference: style_preference,
            includeBooking: include_booking,
            colorScheme: color_scheme
        });
        
        const processingTime = Date.now() - startTime;
        
        res.json({
            success: true,
            data: {
                ...result,
                generation_time: processingTime
            },
            message: 'Homepage generated successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Homepage generation error:', error);
        
        const processingTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'generation_failed',
            message: error.message || 'Failed to generate homepage',
            details: {
                processing_time: processingTime,
                error_type: error.constructor.name
            },
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /generate/sample:
 *   get:
 *     summary: Get sample homepage data
 *     description: Returns a sample homepage generation result for testing and demonstration purposes
 *     tags: [Homepage Generation]
 *     responses:
 *       200:
 *         description: Sample homepage data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "sample_homepage_001"
 *                     business_name:
 *                       type: string
 *                       example: "Sample Business"
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                     html_code:
 *                       type: string
 *                       description: "Complete HTML code for the sample homepage"
 *                     css_code:
 *                       type: string
 *                       description: "CSS styles for the sample homepage"
 *                     style_applied:
 *                       type: string
 *                       example: "modern"
 *                     features_included:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["responsive_design", "modern_layout", "call_to_action"]
 *                     estimated_improvement:
 *                       type: string
 *                       example: "Significant improvement in design and user experience"
 *                 message:
 *                   type: string
 *                   example: "Sample homepage data"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/generate/sample', (req, res) => {
    const sample = {
        id: 'sample_homepage_001',
        business_name: 'Sample Business',
        generated_at: new Date().toISOString(),
        html_code: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Business - Professional Services</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <h1 class="text-2xl font-bold text-gray-900">Sample Business</h1>
                <nav class="hidden md:flex space-x-8">
                    <a href="#services" class="text-gray-600 hover:text-gray-900">Services</a>
                    <a href="#about" class="text-gray-600 hover:text-gray-900">About</a>
                    <a href="#contact" class="text-gray-600 hover:text-gray-900">Contact</a>
                </nav>
            </div>
        </div>
    </header>
    
    <main>
        <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-4xl font-bold mb-6">Professional Services You Can Trust</h2>
                <p class="text-xl mb-8">Quality solutions for your business needs</p>
                <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
                    Get Started
                </button>
            </div>
        </section>
    </main>
</body>
</html>
        `.trim(),
        css_code: '/* Custom styles would be generated here */',
        style_applied: 'modern',
        features_included: ['responsive_design', 'modern_layout', 'call_to_action'],
        estimated_improvement: 'Significant improvement in design and user experience'
    };
    
    res.json({
        success: true,
        data: sample,
        message: 'Sample homepage data',
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Service information
 *     description: Returns basic information about the builder service including available endpoints
 *     tags: [Service Info]
 *     responses:
 *       200:
 *         description: Service information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                   example: "AI Web Upgrader - Homepage Builder Service"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 status:
 *                   type: string
 *                   example: "running"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                     generate:
 *                       type: string
 *                       example: "/generate"
 *                     sample:
 *                       type: string
 *                       example: "/generate/sample"
 *                     screenshot:
 *                       type: string
 *                       example: "/screenshot"
 *                     docs:
 *                       type: string
 *                       example: "/docs"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/', (req, res) => {
    res.json({
        service: 'AI Web Upgrader - Homepage Builder Service',
        version: '1.0.0',
        status: 'running',
        environment: NODE_ENV,
        endpoints: {
            health: '/health',
            generate: '/generate',
            sample: '/generate/sample',
            screenshot: '/screenshot',
            docs: '/docs'
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /screenshot:
 *   post:
 *     summary: Generate screenshot of homepage
 *     description: Creates a screenshot of the provided HTML/CSS content with configurable viewport options
 *     tags: [Screenshot Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScreenshotRequest'
 *           example:
 *             html_content: "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>"
 *             css_content: "body { font-family: Arial, sans-serif; }"
 *             viewport_width: 1200
 *             viewport_height: 800
 *     responses:
 *       200:
 *         description: Screenshot generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ScreenshotResult'
 *                 message:
 *                   type: string
 *                   example: "Screenshot generated successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: Screenshot service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Screenshot generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/screenshot', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { html_code, css_code, format = 'png', viewport = 'desktop' } = req.body;
        
        if (!html_code) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: 'html_code is required',
                timestamp: new Date().toISOString()
            });
        }

        // Check if screenshot service is available
        if (!screenshotService.isReady()) {
            return res.status(503).json({
                success: false,
                error: 'service_unavailable',
                message: 'Screenshot service is not available',
                timestamp: new Date().toISOString()
            });
        }

        // Define viewport options
        const viewportOptions = {
            desktop: { width: 1200, height: 800, deviceScaleFactor: 1, fullPage: true },
            tablet: { width: 768, height: 1024, deviceScaleFactor: 2, fullPage: true },
            mobile: { width: 375, height: 667, deviceScaleFactor: 2, fullPage: true }
        };

        const options = viewportOptions[viewport] || viewportOptions.desktop;
        options.format = format;

        // Generate screenshot
        const screenshotDataUrl = await screenshotService.generateScreenshotDataUrl(
            html_code, 
            css_code || '', 
            options
        );

        const processingTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                screenshot: screenshotDataUrl,
                viewport,
                format,
                generation_time: processingTime
            },
            message: 'Screenshot generated successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Screenshot generation error:', error);
        
        const processingTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'screenshot_generation_failed',
            message: 'Failed to generate screenshot',
            details: {
                error_type: error.name,
                error_message: error.message,
                processing_time: processingTime
            },
            timestamp: new Date().toISOString()
        });
    }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Handle 404 errors
 */
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    res.status(500).json({
        success: false,
        error: 'internal_error',
        message: 'An unexpected error occurred',
        details: NODE_ENV === 'development' ? {
            message: error.message,
            stack: error.stack
        } : {},
        timestamp: new Date().toISOString()
    });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Homepage Builder Service running on port ${PORT}`);
    console.log(`📊 Environment: ${NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    
    // Initialize generator and screenshot service
    try {
        await generator.initialize();
        console.log('✅ Homepage generator initialized');
    } catch (error) {
        console.error('❌ Failed to initialize generator:', error);
    }
    
    // Initialize screenshot service separately (non-blocking)
    try {
        await screenshotService.initialize();
        if (screenshotService.isReady()) {
            console.log('✅ Screenshot service initialized');
        }
    } catch (error) {
        console.error('⚠️ Screenshot service initialization failed:', error.message);
        console.log('📝 Service will continue without screenshot functionality');
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await screenshotService.cleanup();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await screenshotService.cleanup();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;