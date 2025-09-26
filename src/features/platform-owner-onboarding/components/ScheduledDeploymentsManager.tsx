'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, AlertTriangle, X, Rocket, Timer, Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { 
  getScheduledDeploymentsAction,
  cancelScheduledDeploymentAction,
  deployProductToProductionAction 
} from '../actions/environment-actions';
import type { ProductEnvironmentDeployment } from '../types';

interface ScheduledDeploymentsManagerProps {
  onDeploymentUpdate?: () => void;
}

export function ScheduledDeploymentsManager({ 
  onDeploymentUpdate 
}: ScheduledDeploymentsManagerProps) {
  const [scheduledDeployments, setScheduledDeployments] = useState<ProductEnvironmentDeployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<ProductEnvironmentDeployment | null>(null);

  useEffect(() => {
    loadScheduledDeployments();
    
    // Set up periodic refresh
    const interval = setInterval(loadScheduledDeployments, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadScheduledDeployments = async () => {
    try {
      const deployments = await getScheduledDeploymentsAction();
      setScheduledDeployments(deployments);
    } catch (error) {
      console.error('Failed to load scheduled deployments:', error);
      toast({
        description: 'Failed to load scheduled deployments.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDeployment = async (deploymentId: string) => {
    setIsCancelling(deploymentId);
    try {
      await cancelScheduledDeploymentAction(deploymentId);
      toast({
        description: 'Scheduled deployment cancelled successfully.',
        variant: 'default',
      });
      
      await loadScheduledDeployments();
      onDeploymentUpdate?.();
    } catch (error) {
      console.error('Failed to cancel deployment:', error);
      toast({
        description: 'Failed to cancel scheduled deployment.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(null);
    }
  };

  const handleDeployNow = async (deployment: ProductEnvironmentDeployment) => {
    try {
      await deployProductToProductionAction(deployment.product_id);
      toast({
        description: 'Deployment initiated successfully!',
        variant: 'default',
      });
      
      await loadScheduledDeployments();
      onDeploymentUpdate?.();
    } catch (error) {
      console.error('Failed to deploy now:', error);
      toast({
        description: 'Failed to initiate deployment.',
        variant: 'destructive',
      });
    }
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

  const getStatusBadge = (deployment: ProductEnvironmentDeployment) => {
    const timeUntil = getTimeUntilDeployment(deployment.scheduled_for!);
    const isOverdue = timeUntil === 'Overdue';
    const isUpcoming = !isOverdue && new Date(deployment.scheduled_for!).getTime() - new Date().getTime() <= 3600000; // 1 hour
    
    if (isOverdue) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Overdue
      </Badge>;
    } else if (isUpcoming) {
      return <Badge className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Soon
      </Badge>;
    } else {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Scheduled
      </Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Scheduled Deployments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading scheduled deployments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scheduledDeployments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Scheduled Deployments
          </CardTitle>
          <CardDescription>
            Manage your upcoming product deployments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No scheduled deployments</p>
            <p className="text-sm text-gray-400">
              Schedule deployments from your product list to see them here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Scheduled Deployments
          <Badge variant="secondary">{scheduledDeployments.length}</Badge>
        </CardTitle>
        <CardDescription>
          Manage your upcoming product deployments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduledDeployments.map((deployment) => {
            const timeUntil = getTimeUntilDeployment(deployment.scheduled_for!);
            const productName = deployment.deployment_data?.product_name || 'Unknown Product';
            const notificationSettings = deployment.deployment_data?.notification_settings;
            
            return (
              <div 
                key={deployment.id}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{productName}</h4>
                      {getStatusBadge(deployment)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Scheduled for: {formatDate(deployment.scheduled_for!)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Time until deployment: {timeUntil}
                      </p>
                      {notificationSettings?.email_notifications && (
                        <p className="flex items-center gap-2">
                          <Bell className="h-3 w-3" />
                          Email reminder: {notificationSettings.reminder_before_minutes || 30} minutes before
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDeployment(deployment)}
                    >
                      Details
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleDeployNow(deployment)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Rocket className="h-3 w-3 mr-1" />
                      Deploy Now
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancelDeployment(deployment.id)}
                      disabled={isCancelling === deployment.id}
                    >
                      {isCancelling === deployment.id ? (
                        <Clock className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Deployment Details Dialog */}
      <Dialog 
        open={selectedDeployment !== null} 
        onOpenChange={(open) => !open && setSelectedDeployment(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deployment Details</DialogTitle>
            <DialogDescription>
              Information about the scheduled deployment
            </DialogDescription>
          </DialogHeader>
          
          {selectedDeployment && (
            <div className="py-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Product Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedDeployment.deployment_data?.product_name}</p>
                  <p><strong>Price:</strong> ${selectedDeployment.deployment_data?.price}</p>
                  <p><strong>Currency:</strong> {selectedDeployment.deployment_data?.currency}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Schedule Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Scheduled for:</strong> {formatDate(selectedDeployment.scheduled_for!)}</p>
                  <p><strong>Timezone:</strong> {selectedDeployment.deployment_data?.timezone || 'UTC'}</p>
                  <p><strong>Time until deployment:</strong> {getTimeUntilDeployment(selectedDeployment.scheduled_for!)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Notification Settings</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Email notifications:</strong> {
                    selectedDeployment.deployment_data?.notification_settings?.email_notifications ? 'Enabled' : 'Disabled'
                  }</p>
                  <p><strong>Reminder:</strong> {
                    selectedDeployment.deployment_data?.notification_settings?.reminder_before_minutes || 30
                  } minutes before</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedDeployment(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}