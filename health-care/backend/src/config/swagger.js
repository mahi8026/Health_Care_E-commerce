const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MedCore BD API',
      version: '2.0.0',
      description: 'Comprehensive API documentation for MedCore BD medical equipment e-commerce platform',
      contact: {
        name: 'MedCore BD',
        email: 'info@medcorebd.com',
        url: 'https://medcorebd.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001/api',
        description: 'Development server'
      },
      {
        url: 'https://api.medcorebd.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login or /auth/register'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'ECG Machine 12-Lead'
            },
            slug: {
              type: 'string',
              example: 'ecg-machine-12-lead'
            },
            description: {
              type: 'string',
              example: 'Professional 12-lead ECG machine with digital display'
            },
            price: {
              type: 'number',
              example: 45000
            },
            category: {
              type: 'string',
              example: 'Diagnostic Equipment'
            },
            brand: {
              type: 'string',
              example: 'Siemens'
            },
            image: {
              type: 'string',
              example: 'https://res.cloudinary.com/medcore/image/upload/v1/products/ecg.jpg'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            inStock: {
              type: 'boolean',
              example: true
            },
            stockQuantity: {
              type: 'number',
              example: 10
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            orderId: {
              type: 'string',
              example: 'ORD-2024-001234'
            },
            user: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: {
                    type: 'string'
                  },
                  name: {
                    type: 'string'
                  },
                  price: {
                    type: 'number'
                  },
                  quantity: {
                    type: 'number'
                  }
                }
              }
            },
            total: {
              type: 'number',
              example: 45000
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
              example: 'pending'
            },
            paymentMethod: {
              type: 'string',
              enum: ['card', 'cash', 'bkash', 'nagad', 'bank_transfer'],
              example: 'bkash'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed'],
              example: 'pending'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            phone: {
              type: 'string',
              example: '+8801712345678'
            },
            role: {
              type: 'string',
              enum: ['customer', 'b2b_customer', 'admin'],
              example: 'customer'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Products',
        description: 'Product catalog management'
      },
      {
        name: 'Orders',
        description: 'Order management and tracking'
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations'
      },
      {
        name: 'Wishlist',
        description: 'Wishlist management'
      },
      {
        name: 'Payments',
        description: 'Payment processing (bKash, Nagad, cards)'
      },
      {
        name: 'Categories',
        description: 'Product category management'
      },
      {
        name: 'Manufacturers',
        description: 'Brand/manufacturer management'
      },
      {
        name: 'Reviews',
        description: 'Product reviews and ratings'
      },
      {
        name: 'Admin',
        description: 'Admin dashboard and management'
      },
      {
        name: 'Analytics',
        description: 'Sales and performance analytics'
      },
      {
        name: 'Quotes',
        description: 'B2B quotation requests'
      },
      {
        name: 'Returns',
        description: 'Product return requests'
      },
      {
        name: 'Coupons',
        description: 'Discount coupon management'
      },
      {
        name: 'WhatsApp',
        description: 'WhatsApp automation and messaging'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
