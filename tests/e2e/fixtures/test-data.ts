/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  platformOwner: {
    email: process.env.TEST_PLATFORM_OWNER_EMAIL || 'owner@staryer.com',
    password: process.env.TEST_PLATFORM_OWNER_PASSWORD || 'owner-password-123',
    role: 'platform-owner',
    firstName: 'Platform',
    lastName: 'Owner'
  },
  creator: {
    email: process.env.TEST_CREATOR_EMAIL || 'creator@staryer.com',
    password: process.env.TEST_CREATOR_PASSWORD || 'creator-password-123',
    role: 'creator',
    firstName: 'Test',
    lastName: 'Creator',
    companyName: 'Test Creator Company',
    websiteUrl: 'https://testcreator.com'
  },
  endUser: {
    email: process.env.TEST_USER_EMAIL || 'test@staryer.com',
    password: process.env.TEST_USER_PASSWORD || 'test-password-123',
    role: 'user',
    firstName: 'Test',
    lastName: 'User'
  }
};

export const testProducts = {
  saasProduct: {
    name: 'Test SaaS Product',
    description: 'A comprehensive SaaS solution for testing',
    price: '29.99',
    type: 'subscription',
    features: [
      'Unlimited API calls',
      '24/7 support',
      'Advanced analytics'
    ]
  },
  oneTimeProduct: {
    name: 'Test One-Time Product',
    description: 'A one-time purchase product for testing',
    price: '99.99',
    type: 'one-time',
    features: [
      'Lifetime access',
      'Premium features',
      'Priority support'
    ]
  },
  freeProduct: {
    name: 'Test Free Product',
    description: 'A free product for testing',
    price: '0.00',
    type: 'free',
    features: [
      'Basic features',
      'Community support',
      'Limited usage'
    ]
  }
};

export const testPlans = {
  basic: {
    name: 'Basic Plan',
    price: '9.99',
    interval: 'month',
    features: [
      '1,000 API calls/month',
      'Email support',
      'Basic analytics'
    ],
    limits: {
      apiCalls: 1000,
      storage: '1GB',
      users: 1
    }
  },
  pro: {
    name: 'Pro Plan',
    price: '29.99',
    interval: 'month',
    features: [
      '10,000 API calls/month',
      'Priority support',
      'Advanced analytics',
      'Custom integrations'
    ],
    limits: {
      apiCalls: 10000,
      storage: '10GB',
      users: 5
    }
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: '99.99',
    interval: 'month',
    features: [
      'Unlimited API calls',
      'Dedicated support',
      'Custom analytics',
      'White-label options',
      'SLA guarantees'
    ],
    limits: {
      apiCalls: -1, // unlimited
      storage: '100GB',
      users: -1 // unlimited
    }
  }
};

export const testPaymentMethods = {
  validCard: {
    number: '4242424242424242', // Stripe test card
    expiry: '12/25',
    cvc: '123',
    name: 'Test User',
    country: 'US',
    postalCode: '12345'
  },
  declinedCard: {
    number: '4000000000000002', // Stripe declined card
    expiry: '12/25',
    cvc: '123',
    name: 'Test User',
    country: 'US',
    postalCode: '12345'
  },
  internationalCard: {
    number: '4000000000000101', // Stripe international card
    expiry: '12/25',
    cvc: '123',
    name: 'Test User',
    country: 'GB',
    postalCode: 'SW1A 1AA'
  }
};

export const testBranding = {
  defaultBrand: {
    brandColor: '#3B82F6',
    brandName: 'Test Brand',
    brandGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    logo: 'https://via.placeholder.com/200x50/3B82F6/white?text=Test+Brand',
    favicon: 'https://via.placeholder.com/32x32/3B82F6/white?text=T'
  },
  customBrand: {
    brandColor: '#10B981',
    brandName: 'Custom Test Brand',
    brandGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    logo: 'https://via.placeholder.com/200x50/10B981/white?text=Custom+Brand',
    favicon: 'https://via.placeholder.com/32x32/10B981/white?text=C'
  }
};

export const testWhiteLabel = {
  defaultPage: {
    heroTitle: 'Welcome to Test Creator',
    heroSubtitle: 'The best test product ever created for comprehensive testing',
    ctaText: 'Get Started Now',
    showTestimonials: true,
    showPricing: true,
    showFaq: true,
    customDomain: 'testcreator.staryer.com'
  },
  customPage: {
    heroTitle: 'Custom Test Solution',
    heroSubtitle: 'A customized solution designed for your specific testing needs',
    ctaText: 'Start Your Journey',
    showTestimonials: false,
    showPricing: true,
    showFaq: false,
    customDomain: 'custom.testcreator.com'
  }
};

export const testIntegrations = {
  stripeConnect: {
    testMode: true,
    country: 'US',
    currency: 'USD',
    businessType: 'individual',
    accountInfo: {
      firstName: 'Test',
      lastName: 'Creator',
      email: 'creator@staryer.com',
      phone: '+1234567890',
      address: {
        line1: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        postalCode: '12345',
        country: 'US'
      }
    }
  },
  webhooks: {
    testEndpoint: 'https://webhook.site/test-endpoint',
    events: [
      'subscription.created',
      'subscription.updated',
      'subscription.cancelled',
      'payment.succeeded',
      'payment.failed'
    ],
    signingSecret: 'whsec_test_secret_key'
  }
};

export const testUsageData = {
  lowUsage: {
    apiCalls: 100,
    storage: '100MB',
    bandwidth: '1GB',
    percentage: 10
  },
  normalUsage: {
    apiCalls: 5000,
    storage: '5GB',
    bandwidth: '50GB',
    percentage: 50
  },
  highUsage: {
    apiCalls: 9500,
    storage: '9.5GB',
    bandwidth: '95GB',
    percentage: 95
  },
  overLimit: {
    apiCalls: 11000,
    storage: '11GB',
    bandwidth: '110GB',
    percentage: 110
  }
};

export const testAnalytics = {
  dashboard: {
    totalRevenue: '$12,345.67',
    monthlyRecurring: '$5,678.90',
    activeSubscriptions: 142,
    churnRate: '2.3%',
    growthRate: '15.2%'
  },
  trends: [
    { month: 'Jan', revenue: 8500, subscriptions: 85 },
    { month: 'Feb', revenue: 9200, subscriptions: 92 },
    { month: 'Mar', revenue: 10100, subscriptions: 101 },
    { month: 'Apr', revenue: 11300, subscriptions: 113 },
    { month: 'May', revenue: 12345, subscriptions: 142 }
  ]
};

export const selectors = {
  // Common selectors used across tests
  auth: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '.error, .alert-error, [role="alert"]',
    successMessage: '.success, .alert-success'
  },
  navigation: {
    userMenu: '[data-testid="user-menu"], .user-avatar',
    logout: 'text=Sign out, text=Logout',
    dashboard: 'text=Dashboard',
    products: 'text=Products',
    settings: 'text=Settings'
  },
  forms: {
    nameInput: '[name="name"], #name',
    descriptionInput: '[name="description"], #description',
    priceInput: '[name="price"], #price',
    saveButton: 'button:has-text("Save")',
    cancelButton: 'button:has-text("Cancel")'
  }
};