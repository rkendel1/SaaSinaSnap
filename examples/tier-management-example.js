/**
 * Subscription Tier Management Example
 * 
 * This example demonstrates the complete workflow for managing subscription tiers,
 * enforcing usage limits, and automating billing for tier-based overages.
 */

// Example 1: Create subscription tiers for your SaaS
async function setupSubscriptionTiers() {
  const tiers = [
    {
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      price: 29.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'basic_analytics',
        'team_seats:5',
        'custom_domain',
        'email_support'
      ],
      usage_caps: {
        api_calls: 10000,
        projects_created: 10,
        storage_gb: 5
      },
      trial_period_days: 14
    },
    {
      name: 'Pro',
      description: 'Advanced features for growing businesses',
      price: 99.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'advanced_analytics',
        'team_seats:25',
        'custom_domain',
        'priority_support',
        'api_access',
        'webhooks'
      ],
      usage_caps: {
        api_calls: 100000,
        projects_created: 100,
        storage_gb: 50
      },
      is_default: true,
      trial_period_days: 14
    },
    {
      name: 'Enterprise',
      description: 'Unlimited power for large organizations',
      price: 299.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'enterprise_analytics',
        'team_seats:unlimited',
        'custom_domain',
        'dedicated_support',
        'api_access',
        'webhooks',
        'sso',
        'audit_logs'
      ],
      usage_caps: {
        // No caps for enterprise
      },
      trial_period_days: 30
    }
  ];

  for (const tierData of tiers) {
    try {
      const response = await fetch('/api/usage/tiers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CREATOR_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tierData)
      });

      const result = await response.json();
      if (result.success) {
        console.log(`Created tier: ${result.tier.name} (${result.tier.id})`);
      } else {
        console.error(`Failed to create tier ${tierData.name}:`, result.error);
      }
    } catch (error) {
      console.error(`Error creating tier ${tierData.name}:`, error);
    }
  }
}

// Example 2: Check tier enforcement before allowing API calls
async function handleAPIRequest(req, res, userId, creatorId) {
  try {
    // Check if user can make this API call based on their tier
    const enforcementCheck = await fetch('/api/usage/customer/enforcement', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getUserToken(userId)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creatorId: creatorId,
        metricName: 'api_calls',
        requestedUsage: 1
      })
    });

    const enforcement = await enforcementCheck.json();

    if (!enforcement.success) {
      return res.status(500).json({ error: 'Failed to check usage limits' });
    }

    // If usage is blocked, return 429 Too Many Requests
    if (!enforcement.enforcement.allowed) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: enforcement.enforcement.reason,
        upgrade_required: true
      });
    }

    // If approaching limit, include warning in response
    let warning = null;
    if (enforcement.enforcement.should_warn) {
      warning = {
        message: `You're at ${enforcement.enforcement.usage_percentage.toFixed(1)}% of your API call limit`,
        current_usage: enforcement.enforcement.current_usage,
        limit_value: enforcement.enforcement.limit_value,
        usage_percentage: enforcement.enforcement.usage_percentage
      };
    }

    // Process the actual API request
    const apiResult = await processAPIRequest(req);

    // Track the usage
    await fetch('/api/usage/track', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getCreatorToken(creatorId)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_name: 'api_calls',
        user_id: userId,
        value: 1,
        properties: {
          endpoint: req.path,
          method: req.method,
          response_time: Date.now() - req.startTime
        }
      })
    });

    // Return result with optional warning
    return res.json({
      success: true,
      data: apiResult,
      usage_warning: warning
    });

  } catch (error) {
    console.error('API request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Example 3: Customer tier management in React component
function CustomerSubscriptionManager({ creatorId }) {
  const [tierInfo, setTierInfo] = useState(null);
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerTierInfo();
    fetchUpgradeOptions();
  }, [creatorId]);

  const fetchCustomerTierInfo = async () => {
    try {
      const response = await fetch(`/api/usage/customer/tier?creatorId=${creatorId}`);
      const data = await response.json();
      
      if (data.success) {
        setTierInfo(data.tier_info);
      }
    } catch (error) {
      console.error('Error fetching tier info:', error);
    }
  };

  const fetchUpgradeOptions = async () => {
    try {
      const response = await fetch(`/api/usage/customer/upgrade-options?creatorId=${creatorId}`);
      const data = await response.json();
      
      if (data.success) {
        setUpgradeOptions(data.upgrade_options);
      }
    } catch (error) {
      console.error('Error fetching upgrade options:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToTier = async (tierId) => {
    try {
      const response = await fetch('/api/usage/customer/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creatorId,
          tierId,
          prorate: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Redirect to Stripe Checkout or show success message
        if (result.checkout_url) {
          window.location.href = result.checkout_url;
        } else {
          alert('Upgrade initiated successfully!');
          fetchCustomerTierInfo(); // Refresh data
        }
      } else {
        alert('Upgrade failed: ' + result.error);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('An error occurred during upgrade');
    }
  };

  if (loading) {
    return <div>Loading subscription info...</div>;
  }

  if (!tierInfo) {
    return (
      <div className="no-subscription">
        <h3>No Active Subscription</h3>
        <p>Choose a plan to get started with our premium features.</p>
        <button onClick={() => window.location.href = '/pricing'}>
          View Plans
        </button>
      </div>
    );
  }

  return (
    <div className="subscription-manager">
      <div className="current-plan">
        <h3>Current Plan: {tierInfo.tier.name}</h3>
        <p className="price">
          ${tierInfo.tier.price}/{tierInfo.tier.billing_cycle}
        </p>
        <p className="next-billing">
          Next billing: {new Date(tierInfo.next_billing_date).toLocaleDateString()}
        </p>
      </div>

      <div className="usage-summary">
        <h4>Usage This Month</h4>
        {Object.entries(tierInfo.usage_summary).map(([metric, data]) => (
          <div key={metric} className="usage-item">
            <div className="usage-header">
              <span>{metric.replace('_', ' ')}</span>
              <span>{data.current_usage} / {data.limit_value || '∞'}</span>
            </div>
            {data.limit_value && (
              <div className="usage-bar">
                <div 
                  className="usage-fill"
                  style={{ 
                    width: `${Math.min(data.usage_percentage, 100)}%`,
                    backgroundColor: data.usage_percentage > 90 ? '#ef4444' : 
                                   data.usage_percentage > 75 ? '#f97316' : '#10b981'
                  }}
                />
              </div>
            )}
            {data.overage_amount > 0 && (
              <p className="overage-warning">
                {data.overage_amount} over limit - additional charges apply
              </p>
            )}
          </div>
        ))}
      </div>

      {upgradeOptions.length > 0 && (
        <div className="upgrade-options">
          <h4>Recommended Upgrades</h4>
          {upgradeOptions.map((option) => (
            <div key={option.tier.id} className={`upgrade-option ${option.recommended ? 'recommended' : ''}`}>
              <div className="tier-info">
                <h5>{option.tier.name}</h5>
                <p className="price">${option.tier.price}/{option.tier.billing_cycle}</p>
                <p className="upgrade-cost">+${option.upgrade_cost} from current plan</p>
                {option.reason && <p className="reason">{option.reason}</p>}
              </div>
              <button 
                onClick={() => upgradeToTier(option.tier.id)}
                className="upgrade-btn"
              >
                Upgrade Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Example 4: Automated billing processing (cron job)
async function processBillingForAllCreators() {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  // Get all creators with active customers
  const creators = await getActiveCreators();
  
  for (const creator of creators) {
    try {
      console.log(`Processing billing for creator: ${creator.id}`);
      
      // Process overages
      const overageResult = await fetch('/api/usage/billing/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getSystemToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creatorId: creator.id,
          billingPeriod: currentMonth,
          action: 'process_overages'
        })
      });

      const overageData = await overageResult.json();
      console.log(`Processed ${overageData.result.processed} customers, ${overageData.result.errors.length} errors`);

      // Calculate analytics
      await fetch('/api/usage/billing/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getSystemToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creatorId: creator.id,
          billingPeriod: currentMonth,
          action: 'calculate_analytics'
        })
      });

      // Send usage warnings
      await fetch('/api/usage/billing/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getSystemToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creatorId: creator.id,
          billingPeriod: currentMonth,
          action: 'send_warnings'
        })
      });

    } catch (error) {
      console.error(`Failed to process billing for creator ${creator.id}:`, error);
    }
  }
}

// Example 5: Feature flag checking based on tier
function useFeatureAccess(featureName) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { tierInfo } = useCustomerTier();

  useEffect(() => {
    if (tierInfo) {
      const hasFeature = tierInfo.tier.feature_entitlements.some(feature => 
        feature === featureName || feature.startsWith(`${featureName}:`)
      );
      setHasAccess(hasFeature);
      setLoading(false);
    }
  }, [tierInfo, featureName]);

  return { hasAccess, loading };
}

// Usage in component
function AdvancedAnalyticsPage() {
  const { hasAccess, loading } = useFeatureAccess('advanced_analytics');

  if (loading) {
    return <div>Checking access...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="access-denied">
        <h2>Advanced Analytics</h2>
        <p>This feature is available in Pro and Enterprise plans.</p>
        <button onClick={() => window.location.href = '/pricing'}>
          Upgrade Now
        </button>
      </div>
    );
  }

  return (
    <div className="advanced-analytics">
      {/* Advanced analytics content */}
    </div>
  );
}

// Helper functions
function getUserToken(userId) {
  // Return JWT token for the user
  return 'user_jwt_token';
}

function getCreatorToken(creatorId) {
  // Return JWT token for the creator
  return 'creator_jwt_token';
}

function getSystemToken() {
  // Return system/admin token for automated processes
  return 'system_jwt_token';
}

async function processAPIRequest(req) {
  // Mock API processing
  return { result: 'API processed successfully', timestamp: new Date().toISOString() };
}

async function getActiveCreators() {
  // Mock function to get creators with active customers
  return [
    { id: 'creator-1', name: 'SaaS Creator 1' },
    { id: 'creator-2', name: 'SaaS Creator 2' }
  ];
}

export {
  setupSubscriptionTiers,
  handleAPIRequest,
  CustomerSubscriptionManager,
  processBillingForAllCreators,
  useFeatureAccess,
  AdvancedAnalyticsPage
};