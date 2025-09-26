'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, CheckCircle, Clock, History, Rocket, Sparkles, Timer, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

import { 
  deployProductToProductionAction, 
  getProductDeploymentHistoryAction,
  validateProductForDeploymentAction,
  scheduleProductDeploymentAction,
  cancelScheduledDeploymentAction,
  getDeploymentStatusAction
} from '../actions/environment-actions';
import type { ProductEnvironmentDeployment, ValidationResult } from '../types';

interface ProductDeploymentManagerProps {
  productId: string;
  productName: string;
  isTestProduct: boolean;
  hasProductionVersion: boolean;
  lastDeployedAt?: string;
  onDeploymentComplete?: () => void;
}

export function ProductDeploymentManager({ 
  productId, 
  productName, 
  isTestProduct,
  hasProductionVersion, 
  lastDeployedAt,
  onDeploymentComplete 
}: ProductDeploymentManagerProps) {
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentHistory, setDeploymentHistory] = useState<ProductEnvironmentDeployment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState<ProductEnvironmentDeployment | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Scheduling state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(30);

  // Validate product when dialog opens
  useEffect(() => {
    if (isDeployDialogOpen && !isValidating) {
      validateProduct();
    }
  }, [isDeployDialogOpen]);

  // Poll deployment progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (deploymentProgress && deploymentProgress.deployment_status === 'deploying') {
      interval = setInterval(async () => {
        try {
          const status = await getDeploymentStatusAction(deploymentProgress.id);
          if (status) {
            setDeploymentProgress(status);
            
            if (status.deployment_status === 'completed' || status.deployment_status === 'failed') {
              clearInterval(interval);
              setIsDeploying(false);
              if (status.deployment_status === 'completed') {
                onDeploymentComplete?.();
                setIsDeployDialogOpen(false);
                toast({
                  description: (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-500" />
                      <span>{productName} is now live! 🎉</span>
                    </div>
                  ),
                  variant: 'default',
                });
              }
            }
          }
        } catch (error) {
          console.error('Error polling deployment status:', error);
          clearInterval(interval);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deploymentProgress, productName, onDeploymentComplete]);

  const validateProduct = async () => {
    setIsValidating(true);
    try {
      const results = await validateProductForDeploymentAction(productId);
      setValidationResults(results);
    } catch (error) {
      console.error('Failed to validate product:', error);
      toast({
        description: 'Failed to validate product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleInstantDeploy = async () => {
    const hasErrors = validationResults.some(result => result.status === 'failed');
    if (hasErrors) {
      toast({
        description: 'Please resolve all validation errors before deploying.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeploying(true);
    try {
      const deployment = await deployProductToProductionAction(productId);
      setDeploymentProgress(deployment);
      
      // Don't close dialog immediately, let progress tracking handle it
    } catch (error) {
      console.error('Failed to deploy product:', error);
      toast({
        description: 'Failed to deploy product to production. Please try again.',
        variant: 'destructive',
      });
      setIsDeploying(false);
    }
  };

  const handleScheduleDeploy = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast({
        description: 'Please select both date and time for the scheduled deployment.',
        variant: 'destructive',
      });
      return;
    }

    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    
    try {
      await scheduleProductDeploymentAction(productId, scheduledFor, timezone, {
        email_notifications: emailNotifications,
        reminder_before_minutes: reminderMinutes,
      });

      toast({
        description: (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>Deployment scheduled for {new Date(scheduledFor).toLocaleString()}</span>
          </div>
        ),
        variant: 'default',
      });

      setIsScheduleDialogOpen(false);
      onDeploymentComplete?.();
    } catch (error) {
      console.error('Failed to schedule deployment:', error);
      toast({
        description: 'Failed to schedule deployment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const loadDeploymentHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getProductDeploymentHistoryAction(productId);
      setDeploymentHistory(history);
    } catch (error) {
      console.error('Failed to load deployment history:', error);
      toast({
        description: 'Failed to load deployment history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingHistory(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'deploying':
      case 'validating':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getValidationSummary = () => {
    const failed = validationResults.filter(r => r.status === 'failed').length;
    const warnings = validationResults.filter(r => r.status === 'warning').length;
    const passed = validationResults.filter(r => r.status === 'passed').length;

    return { failed, warnings, passed };
  };

  // Only show for test products that can be deployed
  if (!isTestProduct) {
    return null;
  }

  const { failed, warnings, passed } = getValidationSummary();
  const canDeploy = failed === 0 && validationResults.length > 0;

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
            {deploymentProgress && deploymentProgress.deployment_status === 'deploying' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-800">Deploying to Production</span>
                </div>
                <Progress 
                  value={deploymentProgress.progress_percentage || 0} 
                  className="mb-2" 
                />
                <p className="text-sm text-blue-700">
                  {deploymentProgress.progress_message || 'Processing...'}
                </p>
              </div>
            )}

            {/* Validation Results */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Pre-deployment Validation</h4>
                {isValidating && <Clock className="h-4 w-4 animate-spin text-gray-400" />}
              </div>

              {validationResults.length === 0 && !isValidating ? (
                <div className="text-center py-4">
                  <Button 
                    variant="outline" 
                    onClick={validateProduct}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Run Validation
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      {passed} passed
                    </span>
                    {warnings > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertTriangle className="h-3 w-3" />
                        {warnings} warning{warnings !== 1 ? 's' : ''}
                      </span>
                    )}
                    {failed > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <X className="h-3 w-3" />
                        {failed} failed
                      </span>
                    )}
                  </div>

                  {validationResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-2 rounded text-sm ${
                        result.status === 'failed' 
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : result.status === 'warning'
                          ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                          : 'bg-green-50 text-green-800 border border-green-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.message}</p>
                          {result.details && (
                            <p className="text-xs mt-1 opacity-75">
                              {JSON.stringify(result.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">Product Details</h4>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Name:</strong> {productName}
              </p>
              {lastDeployedAt && (
                <p className="text-sm text-gray-600">
                  <strong>Last deployed:</strong> {formatDate(lastDeployedAt)}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleInstantDeploy}
                disabled={!canDeploy || isDeploying}
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
                disabled={!canDeploy || isDeploying}
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
              <Select value={timezone} onValueChange={setTimezone}>
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
                <Select value={reminderMinutes.toString()} onValueChange={(value) => setReminderMinutes(parseInt(value))}>
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

      {/* Deployment History Button */}
      {(hasProductionVersion || deploymentHistory.length > 0) && (
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost"
              className="flex items-center gap-1"
              onClick={() => {
                setIsHistoryDialogOpen(true);
                loadDeploymentHistory();
              }}
            >
              <History className="h-3 w-3" />
              History
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Deployment History</DialogTitle>
              <DialogDescription>
                View all deployments for {productName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading history...</span>
                </div>
              ) : deploymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No deployment history found.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {deploymentHistory.map((deployment) => (
                    <div 
                      key={deployment.id} 
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      {getStatusIcon(deployment.deployment_status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium capitalize">
                            {deployment.deployment_status}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(deployment.created_at)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {deployment.source_environment} → {deployment.target_environment}
                        </p>
                        {deployment.scheduled_for && (
                          <p className="text-xs text-purple-600 mt-1">
                            Scheduled for: {formatDate(deployment.scheduled_for)}
                          </p>
                        )}
                        {deployment.progress_message && (
                          <p className="text-xs text-blue-600 mt-1">
                            {deployment.progress_message}
                          </p>
                        )}
                        {deployment.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            {deployment.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsHistoryDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}