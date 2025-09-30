'use client';

import { useEffect, useState } from 'react';
import { Calendar, CreditCard, Download, FileText, HelpCircle, Settings, TrendingUp, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

interface CustomerSubscription {
  id: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  priceAmount: number;
  currency: string;
  interval: 'month' | 'year';
  cancelAtPeriodEnd: boolean;
}

interface UsageMetric {
  name: string;
  current: number;
  limit: number;
  unit: string;
  resetDate: string;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

interface SupportResource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

interface EnhancedCustomerPortalProps {
  creatorSlug: string;
  customerId?: string;
}

export function EnhancedCustomerPortal({ creatorSlug, customerId }: EnhancedCustomerPortalProps) {
  const [subscription, setSubscription] = useState<CustomerSubscription | null>(null);
  const [usage, setUsage] = useState<UsageMetric[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [supportResources, setSupportResources] = useState<SupportResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockSubscription: CustomerSubscription = {
        id: 'sub_123',
        planName: 'Professional Plan',
        status: 'active',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        priceAmount: 29.99,
        currency: 'usd',
        interval: 'month',
        cancelAtPeriodEnd: false,
      };

      const mockUsage: UsageMetric[] = [
        {
          name: 'API Calls',
          current: 7840,
          limit: 10000,
          unit: 'requests',
          resetDate: '2024-02-01T00:00:00Z',
        },
        {
          name: 'Data Storage',
          current: 2.1,
          limit: 5.0,
          unit: 'GB',
          resetDate: '2024-02-01T00:00:00Z',
        },
        {
          name: 'Active Users',
          current: 45,
          limit: 100,
          unit: 'users',
          resetDate: '2024-02-01T00:00:00Z',
        },
      ];

      const mockBillingHistory: BillingHistory[] = [
        {
          id: 'inv_1',
          date: '2024-01-01T00:00:00Z',
          amount: 29.99,
          currency: 'usd',
          status: 'paid',
          description: 'Professional Plan - January 2024',
          invoiceUrl: '#',
        },
        {
          id: 'inv_2',
          date: '2023-12-01T00:00:00Z',
          amount: 29.99,
          currency: 'usd',
          status: 'paid',
          description: 'Professional Plan - December 2023',
          invoiceUrl: '#',
        },
        {
          id: 'inv_3',
          date: '2023-11-01T00:00:00Z',
          amount: 29.99,
          currency: 'usd',
          status: 'paid',
          description: 'Professional Plan - November 2023',
          invoiceUrl: '#',
        },
      ];

      const mockSupportResources: SupportResource[] = [
        {
          id: '1',
          title: 'Getting Started Guide',
          description: 'Learn the basics of using your account',
          category: 'Getting Started',
          url: '#',
        },
        {
          id: '2',
          title: 'API Documentation',
          description: 'Complete reference for API integration',
          category: 'Technical',
          url: '#',
        },
        {
          id: '3',
          title: 'Billing FAQ',
          description: 'Common questions about billing and payments',
          category: 'Billing',
          url: '#',
        },
      ];

      setSubscription(mockSubscription);
      setUsage(mockUsage);
      setBillingHistory(mockBillingHistory);
      setSupportResources(mockSupportResources);
    } catch (error) {
      console.error('Failed to load customer data:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load account information. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: CustomerSubscription['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBillingStatusColor = (status: BillingHistory['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBarColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleManageSubscription = () => {
    // Redirect to Stripe customer portal
    toast({
      description: 'Redirecting to billing portal...',
    });
  };

  const handleDownloadInvoice = (invoiceUrl: string) => {
    // Download invoice
    toast({
      description: 'Downloading invoice...',
    });
  };

  const handleContactSupport = () => {
    toast({
      description: 'Support contact form opened.',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      {subscription && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscription.planName}</div>
              <p className="text-xs text-muted-foreground">
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(subscription.priceAmount, subscription.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                per {subscription.interval}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDate(subscription.currentPeriodEnd)}
              </div>
              <p className="text-xs text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? 'Subscription ends' : 'Auto-renewal'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {usage.map((metric) => {
              const percentage = (metric.current / metric.limit) * 100;
              return (
                <div key={metric.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className={`text-sm font-medium ${getUsageColor(metric.current, metric.limit)}`}>
                      {metric.current.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${getUsageBarColor(metric.current, metric.limit)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Resets on {formatDate(metric.resetDate)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
          <TabsTrigger value="settings">Account Settings</TabsTrigger>
          <TabsTrigger value="support">Help & Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Payment Successful</p>
                      <p className="text-sm text-gray-600">January 2024 subscription</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Jan 1, 2024</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Usage Alert</p>
                      <p className="text-sm text-gray-600">API usage at 78% of limit</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Jan 15, 2024</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-gray-600">Welcome to the platform!</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Dec 15, 2023</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Billing History</h3>
            <Button onClick={handleManageSubscription}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {billingHistory.map((bill, index) => (
                  <div 
                    key={bill.id} 
                    className={`flex items-center justify-between p-4 ${
                      index !== billingHistory.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{bill.description}</p>
                      <p className="text-sm text-gray-600">{formatDate(bill.date)}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getBillingStatusColor(bill.status)}>
                        {bill.status}
                      </Badge>
                      <span className="font-medium">
                        {formatCurrency(bill.amount, bill.currency)}
                      </span>
                      {bill.invoiceUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadInvoice(bill.invoiceUrl!)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive updates about your account</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Usage Alerts</h4>
                  <p className="text-sm text-gray-600">Get notified when approaching limits</p>
                </div>
                <Button variant="outline">Setup Alerts</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">API Keys</h4>
                  <p className="text-sm text-gray-600">Manage your API access keys</p>
                </div>
                <Button variant="outline">Manage Keys</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Download Data</h4>
                  <p className="text-sm text-gray-600">Export your account data</p>
                </div>
                <Button variant="outline">Export Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="support" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {supportResources.map((resource) => (
                  <div key={resource.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{resource.category}</Badge>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Need help? Our support team is here to assist you.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleContactSupport}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Support Ticket
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleContactSupport}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Live Chat Support
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Average response time: 2-4 hours during business hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}