'use client';

import React, { useState } from 'react';
import { BarChart3, Eye, Lightbulb, Loader2, MapPin, Sparkles, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import type { CreatorProfile } from '@/features/creator-onboarding/types';

import type { VisualizationRequest, VisualizationResponse, VisualizationType } from '../services/advanced-data-visualization-ai-wizard';

interface DataVisualizationToolProps {
  creatorProfile: CreatorProfile;
}

export function DataVisualizationTool({ creatorProfile }: DataVisualizationToolProps) {
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('trend');
  const [dataSource, setDataSource] = useState<string>('revenue');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Total Revenue']);
  const [timeframe, setTimeframe] = useState('30d');
  const [userGoal, setUserGoal] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<VisualizationResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const availableMetrics = [
    'Total Revenue',
    'Monthly Recurring Revenue',
    'Customer Count',
    'Active Subscriptions',
    'Churn Rate',
    'Average Order Value',
    'Conversion Rate',
    'User Engagement',
    'Feature Adoption',
    'Session Duration'
  ];

  const visualizationTypes: { value: VisualizationType; label: string; description: string; icon: any }[] = [
    {
      value: 'heatmap',
      label: 'Heatmap',
      description: 'Show data intensity across dimensions',
      icon: BarChart3
    },
    {
      value: 'trend',
      label: 'Trend Analysis',
      description: 'Display changes over time',
      icon: TrendingUp
    },
    {
      value: 'journey',
      label: 'User Journey Map',
      description: 'Visualize user pathways and flows',
      icon: MapPin
    },
    {
      value: 'funnel',
      label: 'Conversion Funnel',
      description: 'Track conversion steps and drop-offs',
      icon: BarChart3
    },
    {
      value: 'cohort',
      label: 'Cohort Analysis',
      description: 'Analyze user behavior by time groups',
      icon: BarChart3
    },
    {
      value: 'distribution',
      label: 'Distribution',
      description: 'Show data spread across ranges',
      icon: BarChart3
    },
    {
      value: 'comparison',
      label: 'Comparison',
      description: 'Compare metrics across categories',
      icon: BarChart3
    }
  ];

  const handleGetAIRecommendations = async () => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/creator/data-visualization/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: dataSource,
          visualizationType,
          metrics: selectedMetrics,
          timeframe,
          userGoal
        } as VisualizationRequest)
      });

      if (!response.ok) throw new Error('Failed to get AI recommendations');

      const data: VisualizationResponse = await response.json();
      setAiRecommendations(data);

      // Update visualization type if AI recommends a different one
      if (data.recommendedVisualization !== visualizationType) {
        setVisualizationType(data.recommendedVisualization);
      }

      toast({
        title: 'AI Recommendations Ready',
        description: 'Review the suggestions for optimal data visualization.'
      });
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get AI recommendations.'
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleGenerateVisualization = () => {
    if (selectedMetrics.length === 0) {
      toast({
        variant: 'destructive',
        description: 'Please select at least one metric.'
      });
      return;
    }

    setShowPreview(true);
    toast({
      title: 'Visualization Generated',
      description: 'Your data visualization has been created successfully.'
    });
  };

  const selectedVizType = visualizationTypes.find(v => v.value === visualizationType);
  const Icon = selectedVizType?.icon || BarChart3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Data Visualization</h1>
          <p className="text-muted-foreground mt-1">
            Create interactive visualizations with AI-powered insights and recommendations
          </p>
        </div>
        <Button
          onClick={() => setShowAIWizard(!showAIWizard)}
          variant={showAIWizard ? 'default' : 'outline'}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {showAIWizard ? 'Hide' : 'Show'} AI Wizard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Configuration */}
        <div className="md:col-span-2 space-y-6">
          {/* Visualization Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Visualization Type</CardTitle>
              <CardDescription>Select the best visualization for your data insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {visualizationTypes.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setVisualizationType(type.value)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        visualizationType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <TypeIcon className={`h-5 w-5 mt-0.5 ${
                          visualizationType === type.value ? 'text-blue-500' : 'text-gray-500'
                        }`} />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                Visualization Configuration
              </CardTitle>
              <CardDescription>Configure your {selectedVizType?.label} visualization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Select value={dataSource} onValueChange={setDataSource}>
                    <SelectTrigger id="dataSource">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue Data</SelectItem>
                      <SelectItem value="customers">Customer Data</SelectItem>
                      <SelectItem value="subscriptions">Subscription Data</SelectItem>
                      <SelectItem value="usage">Usage Data</SelectItem>
                      <SelectItem value="analytics">Analytics Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Metrics ({selectedMetrics.length} selected)</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
                  {selectedMetrics.map(metric => (
                    <Badge key={metric} variant="secondary">
                      {metric}
                    </Badge>
                  ))}
                  {selectedMetrics.length === 0 && (
                    <span className="text-sm text-muted-foreground">No metrics selected</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Available Metrics</Label>
                <div className="flex flex-wrap gap-2">
                  {availableMetrics.map(metric => {
                    const isSelected = selectedMetrics.includes(metric);
                    return (
                      <Badge
                        key={metric}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                          } else {
                            setSelectedMetrics([...selectedMetrics, metric]);
                          }
                        }}
                      >
                        {metric}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview/Generate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visualization Preview
              </CardTitle>
              <CardDescription>Preview and generate your data visualization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showPreview ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center bg-gradient-to-br from-blue-50 to-purple-50">
                  <Icon className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-xl font-semibold mb-2">{selectedVizType?.label}</h3>
                  <p className="text-muted-foreground mb-4">
                    Showing {selectedMetrics.length} metric(s) over {timeframe}
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    Interactive visualization would appear here
                  </Badge>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Configure your visualization and click Generate to see the preview
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleGenerateVisualization} className="gap-2">
                  <Eye className="h-4 w-4" />
                  {showPreview ? 'Regenerate' : 'Generate'} Visualization
                </Button>
                {showPreview && (
                  <Button variant="outline" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Export
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Wizard Sidebar */}
        {showAIWizard && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  AI Visualization Wizard
                </CardTitle>
                <CardDescription>
                  Get AI-powered recommendations for optimal visualization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userGoal">What do you want to understand?</Label>
                  <Textarea
                    id="userGoal"
                    placeholder="e.g., I want to see how revenue trends correlate with customer acquisition over time"
                    value={userGoal}
                    onChange={(e) => setUserGoal(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleGetAIRecommendations}
                  disabled={isLoadingAI}
                  className="w-full gap-2"
                >
                  {isLoadingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get AI Recommendations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {aiRecommendations && (
              <>
                {/* Recommended Visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommended Visualization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-semibold text-blue-900 mb-1">
                        {visualizationTypes.find(v => v.value === aiRecommendations.recommendedVisualization)?.label}
                      </div>
                      <div className="text-sm text-blue-700">
                        {visualizationTypes.find(v => v.value === aiRecommendations.recommendedVisualization)?.description}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                {aiRecommendations.insights && aiRecommendations.insights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Data Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiRecommendations.insights.map((insight, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-sm ${
                              insight.severity === 'critical'
                                ? 'bg-red-50 border border-red-200'
                                : insight.severity === 'warning'
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}
                          >
                            <div className="font-medium capitalize">{insight.type}</div>
                            <div className="text-muted-foreground">{insight.description}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {aiRecommendations.recommendations && aiRecommendations.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {aiRecommendations.recommendations.map((rec, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-blue-500">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Alternative Visualizations */}
                {aiRecommendations.alternativeVisualizations && aiRecommendations.alternativeVisualizations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Alternative Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiRecommendations.alternativeVisualizations.slice(0, 3).map((alt, index) => (
                          <div
                            key={index}
                            className="p-2 border rounded hover:bg-accent cursor-pointer"
                            onClick={() => setVisualizationType(alt.type)}
                          >
                            <div className="font-medium text-sm">
                              {visualizationTypes.find(v => v.value === alt.type)?.label}
                            </div>
                            <div className="text-xs text-muted-foreground">{alt.useCase}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
