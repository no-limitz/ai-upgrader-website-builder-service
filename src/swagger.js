const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Web Upgrader - Builder Service API',
      version: '1.0.0',
      description: 'Homepage generation service for the AI Web Upgrader POC system',
      contact: {
        name: 'AI Web Upgrader Team',
        email: 'support@aiwebupgrader.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8002',
        description: 'Development server'
      },
      {
        url: 'https://builder.aiwebupgrader.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        AnalysisResult: {
          type: 'object',
          properties: {
            business_type: {
              type: 'string',
              description: 'Type of business (e.g., restaurant, e-commerce, consulting)',
              example: 'restaurant'
            },
            industry: {
              type: 'string',
              description: 'Industry category',
              example: 'food-service'
            },
            current_issues: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of identified issues with the current website',
              example: ['Poor mobile responsiveness', 'Missing contact information']
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Prioritized recommendations for improvement',
              example: ['Add mobile-responsive design', 'Include clear contact form']
            },
            target_keywords: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'SEO target keywords',
              example: ['local restaurant', 'italian cuisine', 'downtown dining']
            },
            confidence_score: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence level of the analysis (0-1)',
              example: 0.89
            }
          },
          required: ['business_type', 'industry', 'current_issues', 'recommendations']
        },
        GenerateHomepageRequest: {
          type: 'object',
          properties: {
            analysis_result: {
              $ref: '#/components/schemas/AnalysisResult'
            },
            business_name: {
              type: 'string',
              description: 'Name of the business',
              example: 'Mario\'s Italian Restaurant'
            },
            style_preference: {
              type: 'string',
              enum: ['modern', 'classic', 'minimal', 'vibrant', 'professional'],
              description: 'Design style preference',
              example: 'modern'
            },
            additional_requirements: {
              type: 'string',
              description: 'Additional specific requirements for the homepage',
              example: 'Include online reservation system'
            }
          },
          required: ['analysis_result', 'business_name']
        },
        HomepageResult: {
          type: 'object',
          properties: {
            html_content: {
              type: 'string',
              description: 'Generated HTML content for the homepage'
            },
            css_content: {
              type: 'string',
              description: 'Generated CSS styles for the homepage'
            },
            business_name: {
              type: 'string',
              description: 'Business name used in generation'
            },
            style_preference: {
              type: 'string',
              description: 'Style preference applied'
            },
            generation_metadata: {
              type: 'object',
              properties: {
                generated_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Timestamp when homepage was generated'
                },
                model_used: {
                  type: 'string',
                  description: 'AI model used for generation'
                },
                processing_time_ms: {
                  type: 'number',
                  description: 'Time taken to generate homepage in milliseconds'
                }
              }
            }
          },
          required: ['html_content', 'css_content', 'business_name']
        },
        ScreenshotRequest: {
          type: 'object',
          properties: {
            html_content: {
              type: 'string',
              description: 'HTML content to capture as screenshot'
            },
            css_content: {
              type: 'string',
              description: 'CSS styles to apply'
            },
            viewport_width: {
              type: 'number',
              minimum: 320,
              maximum: 1920,
              default: 1200,
              description: 'Viewport width for screenshot'
            },
            viewport_height: {
              type: 'number',
              minimum: 240,
              maximum: 1080,
              default: 800,
              description: 'Viewport height for screenshot'
            }
          },
          required: ['html_content']
        },
        ScreenshotResult: {
          type: 'object',
          properties: {
            screenshot_base64: {
              type: 'string',
              description: 'Base64-encoded PNG screenshot'
            },
            metadata: {
              type: 'object',
              properties: {
                width: {
                  type: 'number',
                  description: 'Screenshot width in pixels'
                },
                height: {
                  type: 'number',
                  description: 'Screenshot height in pixels'
                },
                generated_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Timestamp when screenshot was generated'
                }
              }
            }
          },
          required: ['screenshot_base64']
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              description: 'Service health status'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Health check timestamp'
            },
            version: {
              type: 'string',
              description: 'Service version'
            },
            dependencies: {
              type: 'object',
              properties: {
                openai: {
                  type: 'string',
                  enum: ['connected', 'disconnected'],
                  description: 'OpenAI API connection status'
                },
                puppeteer: {
                  type: 'string',
                  enum: ['available', 'unavailable'],
                  description: 'Puppeteer browser availability'
                }
              }
            }
          },
          required: ['status', 'timestamp', 'version']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Additional error details'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          },
          required: ['error']
        }
      }
    }
  },
  apis: ['./src/main.js'], // Path to the API files
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi
};