import type { Request, Response, Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { BaseRoutes } from './base.routes.js';

const baseSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Backend Service API',
    version: '0.1.0'
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'User logged in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/signup/otp/request': {
      post: {
        summary: 'Request signup OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OtpRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'OTP generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OtpResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          409: {
            description: 'Account already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/signup/otp/verify': {
      post: {
        summary: 'Verify signup OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OtpSignupVerifyRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Invalid or expired code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          409: {
            description: 'Account already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/login/otp/request': {
      post: {
        summary: 'Request login OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OtpRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'OTP generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OtpResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/login/otp/verify': {
      post: {
        summary: 'Verify login OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OtpVerifyRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'User logged in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Invalid or expired code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/forgot-password/request': {
      post: {
        summary: 'Request password reset OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OtpRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'OTP generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OtpResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/forgot-password/verify': {
      post: {
        summary: 'Reset password with OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OtpResetVerifyRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Password reset',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Invalid or expired code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/action': {
      post: {
        summary: 'Create an action',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ActionRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Action created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ActionResponse' }
              }
            }
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string', example: 'ok' }
            }
          }
        }
      },
      AuthRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 }
        }
      },
      ActionRequest: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string' },
          payload: {}
        }
      },
      User: {
        type: 'object',
        required: ['id', 'createdAt'],
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email', nullable: true },
          phone: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Action: {
        type: 'object',
        required: ['id', 'userId', 'type', 'payload', 'createdAt'],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          type: { type: 'string' },
          payload: {},
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      AuthResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            required: ['user', 'token'],
            properties: {
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string' }
            }
          }
        }
      },
      ActionResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/Action' }
        }
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            required: ['message'],
            properties: {
              message: { type: 'string' },
              code: { type: 'string' }
            }
          }
        }
      },
      OtpRequest: {
        oneOf: [
          {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' }
            }
          },
          {
            type: 'object',
            required: ['phone'],
            properties: {
              phone: { type: 'string' }
            }
          }
        ]
      },
      OtpVerifyRequest: {
        oneOf: [
          {
            type: 'object',
            required: ['email', 'code'],
            properties: {
              email: { type: 'string', format: 'email' },
              code: { type: 'string', minLength: 6, maxLength: 6 }
            }
          },
          {
            type: 'object',
            required: ['phone', 'code'],
            properties: {
              phone: { type: 'string' },
              code: { type: 'string', minLength: 6, maxLength: 6 }
            }
          }
        ]
      },
      OtpSignupVerifyRequest: {
        oneOf: [
          {
            type: 'object',
            required: ['email', 'code'],
            properties: {
              email: { type: 'string', format: 'email' },
              code: { type: 'string', minLength: 6, maxLength: 6 },
              password: { type: 'string', minLength: 8 }
            }
          },
          {
            type: 'object',
            required: ['phone', 'code'],
            properties: {
              phone: { type: 'string' },
              code: { type: 'string', minLength: 6, maxLength: 6 },
              password: { type: 'string', minLength: 8 }
            }
          }
        ]
      },
      OtpResetVerifyRequest: {
        oneOf: [
          {
            type: 'object',
            required: ['email', 'code', 'newPassword'],
            properties: {
              email: { type: 'string', format: 'email' },
              code: { type: 'string', minLength: 6, maxLength: 6 },
              newPassword: { type: 'string', minLength: 8 }
            }
          },
          {
            type: 'object',
            required: ['phone', 'code', 'newPassword'],
            properties: {
              phone: { type: 'string' },
              code: { type: 'string', minLength: 6, maxLength: 6 },
              newPassword: { type: 'string', minLength: 8 }
            }
          }
        ]
      },
      OtpResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            required: ['sentTo', 'expiresAt'],
            properties: {
              sentTo: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
              otp: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

export class SwaggerRoutes extends BaseRoutes {
  register(): Router {
    this.router.get('/openapi.json', (req: Request, res: Response) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      res.json({
        ...baseSpec,
        servers: [{ url: baseUrl }]
      });
    });

    this.router.use('/', swaggerUi.serve);
    this.router.get(
      '/',
      swaggerUi.setup(undefined, {
        swaggerOptions: {
          url: '/docs/openapi.json'
        }
      })
    );

    return this.router;
  }
}
