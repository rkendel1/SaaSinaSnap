import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Staryer Platform API',
      description: 'Comprehensive API for the Staryer SaaS platform, enabling creator onboarding, usage tracking, billing automation, and more.',
      version: '1.0.0',
      contact: {
        name: 'Staryer Support',
        email: 'support@staryer.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Main API server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok'
            }
          }
        },
        URLExtractionRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com'
            }
          }
        },
        URLExtractionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            data: {
              type: 'object',
              properties: {
                brandColor: { type: 'string' },
                logoUrl: { type: 'string' },
                companyName: { type: 'string' },
                description: { type: 'string' }
              }
            },
            message: {
              type: 'string'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            },
            details: {
              type: 'string'
            }
          }
        }
      }
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health Check',
          description: 'Check if the API is running and healthy',
          tags: ['System'],
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    '$ref': '#/components/schemas/HealthResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/enhanced-extraction': {
        get: {
          summary: 'Get Enhanced Extraction Info',
          description: 'Get information about the enhanced URL extraction service',
          tags: ['URL Extraction'],
          responses: {
            '200': {
              description: 'Service information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      endpoints: { type: 'object' },
                      features: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Extract Branding Data',
          description: 'Extract advanced branding data from a website URL',
          tags: ['URL Extraction'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  '$ref': '#/components/schemas/URLExtractionRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successfully extracted branding data',
              content: {
                'application/json': {
                  schema: {
                    '$ref': '#/components/schemas/URLExtractionResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Bad request - URL is required',
              content: {
                'application/json': {
                  schema: {
                    '$ref': '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    '$ref': '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'System',
        description: 'System health and status endpoints'
      },
      {
        name: 'URL Extraction',
        description: 'Advanced URL extraction and branding analysis'
      },
      {
        name: 'Usage Tracking',
        description: 'Track and manage API usage and billing'
      },
      {
        name: 'Creator Management',
        description: 'Manage creator accounts and settings'
      }
    ]
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}