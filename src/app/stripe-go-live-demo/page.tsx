'use client';

import { useState } from 'react';
import { Sparkles, Timer, History, CheckCircle, Rocket, Calendar, Clock, AlertTriangle, X, Bell } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';

// Mock data for demonstration
const mockProducts = [
  {
    id: 'product-1',
    name: 'Premium SaaS Plan',
    isTestProduct: true,
    hasProductionVersion: false,
    lastDeployedAt: undefined,
  },
  {
    id: 'product-2',
    name: 'Enterprise Solution',
    isTestProduct: true,
    hasProductionVersion: true,
    lastDeployedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'product-3',
    name: 'Starter Package',
    isTestProduct: true,
    hasProductionVersion: false,
    lastDeployedAt: undefined,
  },
];

const mockScheduledDeployments = [
  {
    id: 'deployment-1',
    product_name: 'Premium SaaS Plan',
    scheduled_for: '2024-12-25T09:00:00Z',
    timezone: 'America/New_York',
    email_notifications: true,
    reminder_before_minutes: 30,
    status: 'scheduled'
  },
  {
    id: 'deployment-2', 
    product_name: 'Marketing Suite',
    scheduled_for: '2024-12-31T23:59:00Z',
    timezone: 'UTC',
    email_notifications: true,
    reminder_before_minutes: 60,
    status: 'scheduled'
  }
];

// Mock ProductDeploymentManager component for demo
function MockProductDeploymentManager({ 
  productId, 
  productName, 
  hasProductionVersion, 
  onDeploymentComplete 
}: {
  productId: string;
  productName: string;
  hasProductionVersion: boolean;
  onDeploymentComplete: () => void;
}) {
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleInstantDeploy = async () => {
    setIsDeploying(true);
    setDeploymentProgress(0);
    
    // Simulate deployment process
    const steps = [
      { progress: 10, message: 'Validating product...' },
      { progress: 30, message: 'Creating Stripe clients...' },
      { progress: 50, message: 'Creating product in production...' },
      { progress: 75, message: 'Creating price in production...' },
      { progress: 95, message: 'Updating records...' },
      { progress: 100, message: 'Deployment completed! 🎉' }
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setDeploymentProgress(step.progress);
    }
    
    setTimeout(() => {
      setIsDeploying(false);
      setIsDeployDialogOpen(false);
      onDeploymentComplete();
      toast({
        description: (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-500" />
            <span>{productName} is now live! 🎉</span>
          </div>
        ),
      });
    }, 1000);
  };

  const handleScheduleDeploy = () => {
    if (!scheduleDate || !scheduleTime) {
      toast({
        description: 'Please select both date and time.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      description: (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span>Deployment scheduled for {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}</span>
        </div>
      ),
    });

    setIsScheduleDialogOpen(false);
    onDeploymentComplete();
  };

  return (
    <div className="flex items-center gap-2">
      {/* One-Button Go Live */}
      <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Sparkles className="h-3 w-3" />
            {hasProductionVersion ? 'Update Live' : 'Go Live!'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              {hasProductionVersion ? 'Update Live Product' : 'Go Live with Your Product'}
            </DialogTitle>
            <DialogDescription>
              {hasProductionVersion 
                ? 'Update your live product with the latest changes from your test environment.'
                : 'Make your product available for real customers to purchase. This is exciting! 🚀'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Deployment Progress */}
            {isDeploying && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-800">Deploying to Production</span>
                </div>
                <Progress value={deploymentProgress} className="mb-2" />
                <p className="text-sm text-blue-700">
                  {deploymentProgress === 0 ? 'Starting deployment...' :
                   deploymentProgress === 10 ? 'Validating product...' :
                   deploymentProgress === 30 ? 'Creating Stripe clients...' :
                   deploymentProgress === 50 ? 'Creating product in production...' :
                   deploymentProgress === 75 ? 'Creating price in production...' :
                   deploymentProgress === 95 ? 'Updating records...' :
                   'Deployment completed! 🎉'
                  }
                </p>
              </div>
            )}

            {/* Validation Results */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Pre-deployment Validation</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm mb-2">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    4 passed
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-3 w-3" />
                    1 warning
                  </span>
                </div>

                <div className="p-2 rounded text-sm bg-green-50 text-green-800 border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Product name is valid</p>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded text-sm bg-green-50 text-green-800 border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Product price is valid</p>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded text-sm bg-green-50 text-green-800 border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Stripe integration is valid</p>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium">No custom domain configured</p>
                      <p className="text-xs mt-1 opacity-75">Product will use default domain</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">Product Details</h4>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Name:</strong> {productName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Price:</strong> $29.99/month
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleInstantDeploy}
                disabled={isDeploying}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {isDeploying ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy Now
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeployDialogOpen(false);
                  setIsScheduleDialogOpen(true);
                }}
                disabled={isDeploying}
                className="flex items-center gap-2"
              >
                <Timer className="h-4 w-4" />
                Schedule
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeployDialogOpen(false)}
              disabled={isDeploying}
            >
              {isDeploying ? 'Close' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Deployment Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Schedule Deployment
            </DialogTitle>
            <DialogDescription>
              Choose when you want {productName} to go live.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="America/New_York">
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div>
                <Label htmlFor="reminder-minutes">Reminder (minutes before)</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleScheduleDeploy}>
              Schedule Deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock ScheduledDeploymentsManager component for demo
function MockScheduledDeploymentsManager() {
  const [deployments, setDeployments] = useState(mockScheduledDeployments);

  const getTimeUntilDeployment = (scheduledFor: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledFor);
    const diffMs = scheduled.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Overdue';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const handleCancel = (id: string) => {
    setDeployments(prev => prev.filter(d => d.id !== id));
    toast({
      description: 'Scheduled deployment cancelled successfully.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Scheduled Deployments
          <Badge variant="secondary">{deployments.length}</Badge>
        </CardTitle>
        <CardDescription>
          Manage your upcoming product deployments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deployments.map((deployment) => {
            const timeUntil = getTimeUntilDeployment(deployment.scheduled_for);
            
            return (
              <div 
                key={deployment.id}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{deployment.product_name}</h4>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Scheduled for: {formatDate(deployment.scheduled_for)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Time until deployment: {timeUntil}
                      </p>
                      <p className="flex items-center gap-2">
                        <Bell className="h-3 w-3" />
                        Email reminder: {deployment.reminder_before_minutes} minutes before
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Rocket className="h-3 w-3 mr-1" />
                      Deploy Now
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(deployment.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StripeGoLiveDemoPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeploymentComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-green-500" />
          Enhanced Stripe Go-Live Experience
        </h1>
        <p className="text-gray-600 text-lg">
          Demo of the improved one-button go-live and scheduled deployment functionality
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-green-500" />
              One-Button Go Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Delightful single-click deployment with real-time progress tracking and validation
            </p>
            <div className="mt-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Pre-deployment validation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Real-time progress updates</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Celebration on completion</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Timer className="h-5 w-5 text-blue-500" />
              Scheduled Go Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Schedule deployments for optimal timing with email notifications and reminders
            </p>
            <div className="mt-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Date/time scheduling</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Email notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Customizable reminders</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-purple-500" />
              Robust Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Comprehensive error handling, monitoring, and deployment history tracking
            </p>
            <div className="mt-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Detailed error handling</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Deployment history</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Status monitoring</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Deployments Dashboard */}
      <div className="mb-8">
        <MockScheduledDeploymentsManager />
      </div>

      {/* Product Deployment Demos */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Product Deployment Demos</h2>
          <p className="text-gray-600 mb-6">
            Try the enhanced deployment experience with these demo products:
          </p>
        </div>

        <div className="grid gap-6">
          {mockProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {product.name}
                      {product.hasProductionVersion ? (
                        <Badge className="bg-green-100 text-green-800">Live</Badge>
                      ) : (
                        <Badge variant="secondary">Test Only</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {product.hasProductionVersion 
                        ? `Last deployed: ${new Date(product.lastDeployedAt!).toLocaleDateString()}`
                        : 'Ready for first deployment'
                      }
                    </CardDescription>
                  </div>
                  
                  <MockProductDeploymentManager
                    key={`${product.id}-${refreshKey}`}
                    productId={product.id}
                    productName={product.name}
                    hasProductionVersion={product.hasProductionVersion}
                    onDeploymentComplete={handleDeploymentComplete}
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Demo Mode</h3>
            <p className="text-blue-800 text-sm">
              This is a demonstration page showcasing the enhanced Stripe go-live functionality. 
              In a real environment, these would connect to actual Stripe products and perform 
              real deployments with proper authentication and tenant isolation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}