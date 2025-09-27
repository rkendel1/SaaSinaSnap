#!/usr/bin/env node

/**
 * Demo Data Initialization Script
 * Creates comprehensive mock data for all features and user roles
 */

const fs = require('fs');
const path = require('path');

console.log('🎭 Initializing comprehensive demo data...\n');

/**
 * Platform Owner Demo Data
 */
function createPlatformOwnerData() {
  console.log('👑 Creating Platform Owner demo data...');
  
  const platformOwnerData = {
    profile: {
      id: 'platform-owner-demo',
      email: 'owner@staryer.com',
      name: 'Platform Owner',
      role: 'platform_owner',
      created_at: '2023-01-01T00:00:00Z',
      avatar_url: '/demo-assets/platform-owner-avatar.png'
    },
    
    dashboardMetrics: {
      totalRevenue: 125750.50,
      monthlyGrowth: 15.3,
      activeCreators: 42,
      totalUsers: 1847,
      conversionRate: 3.2,
      churnRate: 2.1,
      averageRevenuePerUser: 68.15,
      platformFee: 0.08, // 8%
      
      revenueHistory: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toISOString().substring(0, 7),
        revenue: Math.floor(Math.random() * 20000) + 80000,
        growth: (Math.random() * 20 - 5).toFixed(1)
      })),
      
      topCreators: [
        { id: 'creator-1', name: 'TechGuru Solutions', revenue: 28500, growth: 22.3 },
        { id: 'creator-2', name: 'Creative Studio Pro', revenue: 19200, growth: 18.7 },
        { id: 'creator-3', name: 'Business Accelerator', revenue: 15800, growth: 12.4 },
        { id: 'creator-4', name: 'Digital Marketing Hub', revenue: 12300, growth: 9.8 },
        { id: 'creator-5', name: 'Fitness Expert', revenue: 9750, growth: 15.2 }
      ],
      
      userGrowth: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 50) + 10,
        activeUsers: Math.floor(Math.random() * 200) + 800
      }))
    },
    
    platformSettings: {
      platform_name: 'Staryer Platform',
      platform_description: 'The ultimate creator monetization platform',
      platform_url: 'https://staryer.com',
      support_email: 'support@staryer.com',
      notifications_enabled: true,
      maintenance_mode: false,
      registration_enabled: true,
      creator_approval_required: false,
      default_creator_commission: 0.92, // 92% to creator, 8% platform fee
      
      integrations: {
        stripe: { enabled: true, configured: true },
        email: { enabled: true, provider: 'resend' },
        analytics: { enabled: true, provider: 'posthog' },
        ai: { enabled: true, provider: 'openai' }
      }
    }
  };
  
  return platformOwnerData;
}

/**
 * Creator Demo Data
 */
function createCreatorData() {
  console.log('🎨 Creating Creator demo data...');
  
  const creatorData = {
    profiles: [
      {
        id: 'creator-demo-1',
        email: 'creator@staryer.com',
        name: 'Sarah Chen',
        business_name: 'TechGuru Solutions',
        role: 'creator',
        created_at: '2023-03-15T00:00:00Z',
        onboarding_completed: true,
        onboarding_step: 7,
        
        branding: {
          primary_color: '#3B82F6',
          secondary_color: '#8B5CF6',
          font_family: 'Inter',
          logo_url: '/demo-assets/creator-logo-1.png',
          banner_url: '/demo-assets/creator-banner-1.png'
        },
        
        stripe_account_id: 'acct_demo_creator_1',
        stripe_onboarding_completed: true,
        website_url: 'https://techguru-solutions.staryer.com',
        
        products: [
          {
            id: 'product-demo-1',
            name: 'Premium SaaS Toolkit',
            description: 'Complete toolkit for building scalable SaaS applications',
            price: 2999, // $29.99
            status: 'active',
            type: 'subscription',
            billing_period: 'monthly',
            features: [
              'Advanced Analytics Dashboard',
              'API Access & Documentation',
              'White-label Solutions',
              'Priority Support',
              'Custom Integrations'
            ],
            created_at: '2023-04-01T00:00:00Z'
          },
          {
            id: 'product-demo-2',
            name: 'Startup Bundle',
            description: 'Perfect starter package for new businesses',
            price: 999, // $9.99
            status: 'active',
            type: 'one_time',
            features: [
              'Business Plan Template',
              'Marketing Resources',
              'Financial Planning Tools',
              '30-day Email Course'
            ],
            created_at: '2023-04-15T00:00:00Z'
          }
        ],
        
        analytics: {
          totalRevenue: 28500,
          monthlyRecurring: 15600,
          oneTimeRevenue: 12900,
          subscribers: 89,
          conversionRate: 4.2,
          churnRate: 1.8,
          
          salesHistory: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(2024, i, 1).toISOString().substring(0, 7),
            revenue: Math.floor(Math.random() * 5000) + 15000,
            subscribers: Math.floor(Math.random() * 20) + 60
          }))
        }
      },
      
      {
        id: 'creator-demo-2',
        email: 'creator2@staryer.com',
        name: 'Mike Rodriguez',
        business_name: 'Creative Studio Pro',
        role: 'creator',
        created_at: '2023-02-20T00:00:00Z',
        onboarding_completed: true,
        onboarding_step: 7,
        
        branding: {
          primary_color: '#EF4444',
          secondary_color: '#F59E0B',
          font_family: 'Poppins',
          logo_url: '/demo-assets/creator-logo-2.png',
          banner_url: '/demo-assets/creator-banner-2.png'
        },
        
        stripe_account_id: 'acct_demo_creator_2',
        stripe_onboarding_completed: true,
        website_url: 'https://creative-studio-pro.staryer.com',
        
        products: [
          {
            id: 'product-demo-3',
            name: 'Design Masterclass',
            description: 'Learn professional design principles and techniques',
            price: 4999, // $49.99
            status: 'active',
            type: 'one_time',
            features: [
              '50+ Video Lessons',
              'Design Templates',
              'Resource Library',
              'Community Access',
              'Certificate of Completion'
            ],
            created_at: '2023-03-01T00:00:00Z'
          }
        ],
        
        analytics: {
          totalRevenue: 19200,
          monthlyRecurring: 0,
          oneTimeRevenue: 19200,
          subscribers: 0,
          customers: 384, // One-time purchases
          conversionRate: 3.8,
          
          salesHistory: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(2024, i, 1).toISOString().substring(0, 7),
            revenue: Math.floor(Math.random() * 3000) + 10000,
            customers: Math.floor(Math.random() * 50) + 20
          }))
        }
      }
    ]
  };
  
  return creatorData;
}

/**
 * End User Demo Data
 */
function createEndUserData() {
  console.log('👤 Creating End User demo data...');
  
  const endUserData = {
    profiles: [
      {
        id: 'user-demo-1',
        email: 'user@staryer.com',
        name: 'Alex Johnson',
        role: 'user',
        created_at: '2023-06-10T00:00:00Z',
        avatar_url: '/demo-assets/user-avatar-1.png'
      },
      {
        id: 'user-demo-2',
        email: 'user2@staryer.com',
        name: 'Emily Davis',
        role: 'user',
        created_at: '2023-07-22T00:00:00Z',
        avatar_url: '/demo-assets/user-avatar-2.png'
      }
    ],
    
    subscriptions: [
      {
        id: 'sub-demo-1',
        user_id: 'user-demo-1',
        product_id: 'product-demo-1',
        creator_id: 'creator-demo-1',
        status: 'active',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        plan_name: 'Premium SaaS Toolkit',
        amount: 2999,
        
        usage: {
          api_calls: 15420,
          api_limit: 50000,
          storage_used: 2.3, // GB
          storage_limit: 10, // GB
          features_used: ['analytics', 'api_access', 'support']
        }
      }
    ],
    
    purchases: [
      {
        id: 'purchase-demo-1',
        user_id: 'user-demo-1',
        product_id: 'product-demo-2',
        creator_id: 'creator-demo-1',
        status: 'completed',
        amount: 999,
        purchased_at: '2023-12-15T00:00:00Z',
        product_name: 'Startup Bundle'
      },
      {
        id: 'purchase-demo-2',
        user_id: 'user-demo-2',
        product_id: 'product-demo-3',
        creator_id: 'creator-demo-2',
        status: 'completed',
        amount: 4999,
        purchased_at: '2023-11-08T00:00:00Z',
        product_name: 'Design Masterclass'
      }
    ],
    
    usageHistory: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      api_calls: Math.floor(Math.random() * 800) + 200,
      storage_used: (Math.random() * 0.5 + 2).toFixed(2)
    }))
  };
  
  return endUserData;
}

/**
 * Authentication Demo Data
 */
function createAuthData() {
  console.log('🔐 Creating authentication demo data...');
  
  const authData = {
    users: [
      {
        id: 'platform-owner-demo',
        email: 'owner@staryer.com',
        password_hash: '$2b$10$demo-hash-platform-owner',
        role: 'platform_owner',
        email_verified: true,
        created_at: '2023-01-01T00:00:00Z',
        last_sign_in: new Date().toISOString()
      },
      {
        id: 'creator-demo-1',
        email: 'creator@staryer.com',
        password_hash: '$2b$10$demo-hash-creator-1',
        role: 'creator',
        email_verified: true,
        created_at: '2023-03-15T00:00:00Z',
        last_sign_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'user-demo-1',
        email: 'user@staryer.com',
        password_hash: '$2b$10$demo-hash-user-1',
        role: 'user',
        email_verified: true,
        created_at: '2023-06-10T00:00:00Z',
        last_sign_in: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    
    sessions: [
      {
        id: 'session-demo-1',
        user_id: 'platform-owner-demo',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }
    ],
    
    authProviders: [
      { provider: 'email', enabled: true },
      { provider: 'google', enabled: true },
      { provider: 'github', enabled: true }
    ]
  };
  
  return authData;
}

/**
 * System Demo Data
 */
function createSystemData() {
  console.log('⚙️ Creating system demo data...');
  
  const systemData = {
    notifications: [
      {
        id: 'notif-1',
        type: 'success',
        title: 'New Creator Signup',
        message: 'Sarah Chen has completed onboarding',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: 'notif-2',
        type: 'info',
        title: 'Payment Processed',
        message: 'Monthly subscription payment received: $29.99',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: 'notif-3',
        type: 'warning',
        title: 'High API Usage',
        message: 'Creator TechGuru Solutions approaching API limits',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true
      }
    ],
    
    systemHealth: {
      status: 'healthy',
      uptime: '99.98%',
      lastIncident: '2023-11-15T14:30:00Z',
      services: {
        api: 'operational',
        database: 'operational',
        payments: 'operational',
        email: 'operational',
        storage: 'operational'
      }
    },
    
    auditLog: [
      {
        id: 'audit-1',
        action: 'user_login',
        user_id: 'platform-owner-demo',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString()
      },
      {
        id: 'audit-2',
        action: 'product_created',
        user_id: 'creator-demo-1',
        resource_id: 'product-demo-1',
        details: { product_name: 'Premium SaaS Toolkit' },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
  
  return systemData;
}

/**
 * Write demo data to files
 */
function writeDemoDataFiles(demoData) {
  console.log('💾 Writing demo data files...');
  
  const demoDir = path.join(process.cwd(), 'demo-data');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }
  
  // Write individual data files
  Object.entries(demoData).forEach(([key, data]) => {
    const filename = `${key}.json`;
    fs.writeFileSync(
      path.join(demoDir, filename),
      JSON.stringify(data, null, 2)
    );
    console.log(`✅ Created ${filename}`);
  });
  
  // Create comprehensive index file
  const indexData = {
    generated_at: new Date().toISOString(),
    version: '1.0.0',
    description: 'Comprehensive demo data for Staryer platform',
    files: Object.keys(demoData).map(key => `${key}.json`),
    summary: {
      platform_owners: 1,
      creators: 2,
      end_users: 2,
      products: 3,
      subscriptions: 1,
      purchases: 2
    }
  };
  
  fs.writeFileSync(
    path.join(demoDir, 'index.json'),
    JSON.stringify(indexData, null, 2)
  );
  
  console.log('✅ Created index.json');
}

/**
 * Create demo assets directory structure
 */
function createDemoAssets() {
  console.log('🎨 Creating demo assets structure...');
  
  const assetsDir = path.join(process.cwd(), 'public', 'demo-assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Create placeholder asset files
  const assetFiles = [
    'platform-owner-avatar.png',
    'creator-logo-1.png',
    'creator-logo-2.png',
    'creator-banner-1.png',
    'creator-banner-2.png',
    'user-avatar-1.png',
    'user-avatar-2.png'
  ];
  
  assetFiles.forEach(filename => {
    const filePath = path.join(assetsDir, filename);
    if (!fs.existsSync(filePath)) {
      // Create a simple placeholder text file
      fs.writeFileSync(filePath, `Demo asset placeholder: ${filename}`);
    }
  });
  
  console.log('✅ Demo assets structure created');
}

/**
 * Main initialization function
 */
async function main() {
  try {
    console.log('🎭 Initializing comprehensive demo data for Staryer platform...\n');
    
    // Create all demo data
    const platformOwnerData = createPlatformOwnerData();
    const creatorData = createCreatorData();
    const endUserData = createEndUserData();
    const authData = createAuthData();
    const systemData = createSystemData();
    
    // Combine all data
    const comprehensiveDemoData = {
      platformOwner: platformOwnerData,
      creators: creatorData,
      endUsers: endUserData,
      authentication: authData,
      system: systemData
    };
    
    // Write data files
    writeDemoDataFiles(comprehensiveDemoData);
    
    // Create demo assets
    createDemoAssets();
    
    console.log('\n✅ Demo data initialization completed successfully!');
    console.log('📊 Generated comprehensive demo data including:');
    console.log('   - Platform Owner dashboard with metrics and analytics');
    console.log('   - Creator profiles with products and branding');
    console.log('   - End user subscriptions and purchase history');
    console.log('   - Authentication data for all roles');
    console.log('   - System notifications and audit logs');
    console.log('\n📁 Demo data available in: demo-data/');
    console.log('🎨 Demo assets available in: public/demo-assets/');
    console.log('\n🚀 Demo environment ready for all user roles and features!');
    
  } catch (error) {
    console.error('❌ Demo data initialization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createPlatformOwnerData,
  createCreatorData,
  createEndUserData,
  createAuthData,
  createSystemData
};