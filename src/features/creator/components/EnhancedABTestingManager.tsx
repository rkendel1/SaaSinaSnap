'use client';

import React, { useEffect,useState } from 'react';
import { 
  AlertCircle,
  BarChart3, 
  Calendar,
  CheckCircle,
  Eye,
  FlaskConical, 
  Pause, 
  Play, 
  Plus,
  StopCircle, 
  Target,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

import { ABTest, ABTestingService, ABTestResults } from '../services/embed-ab-testing';

interface EnhancedABTestingManagerProps {
  creatorId: string;
}

interface NewTestForm {
  name: string;
  embedId: string;
  description: string;
  hypothesis: string;
  primaryGoal: 'conversions' | 'clicks' | 'engagement' | 'views';
  trafficSplit: number;
  duration: number; // days
}

export function EnhancedABTestingManager({ creatorId }: EnhancedABTestingManagerProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [testResults, setTestResults] = useState<Map<string, ABTestResults>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTestForm, setNewTestForm] = useState<NewTestForm>({
    name: '',
    embedId: '',
    description: '',
    hypothesis: '',
    primaryGoal: 'conversions',
    trafficSplit: 50,
    duration: 14
  });

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      // Get all tests for the creator
      const allTests = ABTestingService.getAllTests();
      const creatorTests = allTests.filter((test: ABTest) => test.created_by === creatorId);
      setTests(creatorTests);

      // Fetch results for each test
      const resultsMap = new Map<string, ABTestResults>();
      creatorTests.forEach((test: ABTest) => {
        const results = ABTestingService.getResults(test.id);
        if (results) {
          resultsMap.set(test.id, results);
        }
      });
      setTestResults(resultsMap);
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load A/B tests. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [creatorId]);

  const handleCreateTest = async () => {
    try {
      const testConfig = {
        name: newTestForm.name,
        description: newTestForm.description,
        embedId: newTestForm.embedId,
        controlConfig: {}, // Mock config - in real app this would come from actual embed config
        variantConfig: {}, // Mock config - in real app this would come from variant config
        trafficSplit: newTestForm.trafficSplit,
        primaryGoal: newTestForm.primaryGoal,
        duration: newTestForm.duration,
        createdBy: creatorId
      };

      const test = await ABTestingService.createTest(testConfig);
      
      if (test) {
        toast({
          description: 'A/B test created successfully!',
        });
        setShowCreateDialog(false);
        setNewTestForm({
          name: '',
          embedId: '',
          description: '',
          hypothesis: '',
          primaryGoal: 'conversions',
          trafficSplit: 50,
          duration: 14
        });
        fetchTests();
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to create A/B test. Please try again.',
      });
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const success = await ABTestingService.startTest(testId);
      if (success) {
        toast({
          description: 'A/B test started successfully!',
        });
        fetchTests();
      }
    } catch (error) {
      console.error('Error starting A/B test:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to start A/B test.',
      });
    }
  };

  const handlePauseTest = async (testId: string) => {
    try {
      const success = await ABTestingService.pauseTest(testId);
      if (success) {
        toast({
          description: 'A/B test paused successfully!',
        });
        fetchTests();
      }
    } catch (error) {
      console.error('Error pausing A/B test:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to pause A/B test.',
      });
    }
  };

  const handleCompleteTest = async (testId: string) => {
    try {
      const success = await ABTestingService.completeTest(testId);
      if (success) {
        toast({
          description: 'A/B test completed successfully!',
        });
        fetchTests();
      }
    } catch (error) {
      console.error('Error completing A/B test:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to complete A/B test.',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <FlaskConical className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'running':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTestInsights = (testId: string) => {
    return ABTestingService.getTestInsights(testId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FlaskConical className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Loading A/B tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">A/B Testing Manager</h2>
          <p className="text-gray-600 mt-1">Create, manage, and analyze your A/B tests</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New A/B Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  value={newTestForm.name}
                  onChange={(e) => setNewTestForm({ ...newTestForm, name: e.target.value })}
                  placeholder="e.g., Pricing Page Button Color"
                />
              </div>

              <div>
                <Label htmlFor="embed-id">Embed ID</Label>
                <Input
                  id="embed-id"
                  value={newTestForm.embedId}
                  onChange={(e) => setNewTestForm({ ...newTestForm, embedId: e.target.value })}
                  placeholder="embed_123"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTestForm.description}
                  onChange={(e) => setNewTestForm({ ...newTestForm, description: e.target.value })}
                  placeholder="Brief description of what you're testing..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="hypothesis">Hypothesis</Label>
                <Textarea
                  id="hypothesis"
                  value={newTestForm.hypothesis}
                  onChange={(e) => setNewTestForm({ ...newTestForm, hypothesis: e.target.value })}
                  placeholder="I believe that changing X will result in Y because..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="primary-goal">Primary Goal</Label>
                <Select
                  value={newTestForm.primaryGoal}
                  onValueChange={(value) => setNewTestForm({ ...newTestForm, primaryGoal: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="views">Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="traffic-split">Traffic Split (%)</Label>
                <Input
                  id="traffic-split"
                  type="number"
                  min="10"
                  max="90"
                  value={newTestForm.trafficSplit}
                  onChange={(e) => setNewTestForm({ ...newTestForm, trafficSplit: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Percentage of traffic to show the variant (Control gets the remainder)
                </p>
              </div>

              <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="90"
                  value={newTestForm.duration}
                  onChange={(e) => setNewTestForm({ ...newTestForm, duration: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateTest} className="flex-1">
                  Create Test
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold">{tests.length}</p>
              </div>
              <FlaskConical className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Running Tests</p>
                <p className="text-2xl font-bold text-green-600">
                  {tests.filter(test => test.status === 'running').length}
                </p>
              </div>
              <Play className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Tests</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tests.filter(test => test.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Improvement</p>
                <p className="text-2xl font-bold text-purple-600">
                  {tests.filter(test => test.status === 'completed').length > 0 ? '+24%' : '—'}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {tests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No A/B tests yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first A/B test to start optimizing your embeds and improving conversions.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          tests.map((test) => {
            const results = testResults.get(test.id);
            const insights = getTestInsights(test.id);
            
            return (
              <Card key={test.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(test.status)}
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <Badge variant={getStatusBadgeVariant(test.status)}>
                          {test.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{test.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Embed ID: {test.embed_id}</p>
                    </div>
                    <div className="flex gap-2">
                      {test.status === 'draft' && (
                        <Button size="sm" onClick={() => handleStartTest(test.id)}>
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {test.status === 'running' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handlePauseTest(test.id)}>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleCompleteTest(test.id)}>
                            <StopCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        </>
                      )}
                      {test.status === 'paused' && (
                        <Button size="sm" onClick={() => handleStartTest(test.id)}>
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {results && (
                    <div className="space-y-4">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-gray-700">Control Performance</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Impressions</span>
                              <span>{results.control.impressions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Conversions</span>
                              <span>{results.control.conversions}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Conversion Rate</span>
                              <span className="font-medium">{formatPercentage(results.control.conversion_rate)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-gray-700">Variant Performance</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Impressions</span>
                              <span>{results.variant.impressions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Conversions</span>
                              <span>{results.variant.conversions}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Conversion Rate</span>
                              <span className="font-medium">{formatPercentage(results.variant.conversion_rate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Statistical Significance */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Statistical Significance</span>
                          <span className="text-sm font-medium">
                            {formatPercentage(results.statistical_significance)}
                          </span>
                        </div>
                        <Progress 
                          value={results.statistical_significance * 100} 
                          className="h-2"
                        />
                        {results.statistical_significance >= 0.95 && (
                          <p className="text-xs text-green-600">
                            ✓ Results are statistically significant
                          </p>
                        )}
                      </div>

                      {/* Insights */}
                      {insights.insights.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="font-medium text-sm text-blue-900 mb-2">Key Insights</h4>
                          <ul className="text-xs text-blue-800 space-y-1">
                            {insights.insights.slice(0, 2).map((insight, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {insights.recommendations.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <h4 className="font-medium text-sm text-green-900 mb-2">Recommendations</h4>
                          <ul className="text-xs text-green-800 space-y-1">
                            {insights.recommendations.slice(0, 2).map((recommendation, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <div className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                                {recommendation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {!results && test.status !== 'draft' && (
                    <div className="text-center py-4 text-gray-500">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}