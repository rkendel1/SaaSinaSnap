'use client';

import React, { useState } from 'react';
import { BarChart3, Download, FileText, Lightbulb, Loader2, Plus, Save, Sparkles, X } from 'lucide-react';

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

import type { ReportBuilderRequest, ReportBuilderResponse } from '../services/report-builder-ai-wizard';

interface ReportBuilderToolProps {
  creatorProfile: CreatorProfile;
}

interface ReportSection {
  id: string;
  name: string;
  metrics: string[];
  visualizationType: 'table' | 'chart' | 'card' | 'graph';
}

export function ReportBuilderTool({ creatorProfile }: ReportBuilderToolProps) {
  const [reportType, setReportType] = useState<'revenue' | 'customer' | 'usage' | 'custom'>('custom');
  const [reportTitle, setReportTitle] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState('30d');
  const [userQuery, setUserQuery] = useState('');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<ReportBuilderResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);

  const availableMetrics = [
    'Total Revenue',
    'Monthly Recurring Revenue (MRR)',
    'Average Revenue Per User (ARPU)',
    'Total Customers',
    'New Customers',
    'Customer Churn Rate',
    'Active Subscriptions',
    'Conversion Rate',
    'Active Users',
    'Feature Adoption Rate',
    'Average Session Duration'
  ];

  const handleGetAIRecommendations = async () => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/creator/report-builder/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          metrics: selectedMetrics,
          timeframe,
          userQuery
        } as ReportBuilderRequest)
      });

      if (!response.ok) throw new Error('Failed to get AI recommendations');

      const data: ReportBuilderResponse = await response.json();
      setAiRecommendations(data);
      
      // Auto-populate report structure from AI recommendations
      if (data.reportStructure) {
        setReportTitle(data.reportStructure.title);
        setReportSections(data.reportStructure.sections.map((section, index) => ({
          id: `section-${index}`,
          ...section
        })));
      }

      toast({
        title: 'AI Recommendations Ready',
        description: 'Review the suggestions and customize your report.'
      });
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get AI recommendations. Using default structure.'
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAddMetric = (metric: string) => {
    if (!selectedMetrics.includes(metric)) {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const handleRemoveMetric = (metric: string) => {
    setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
  };

  const handleAddSection = () => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      metrics: [],
      visualizationType: 'card'
    };
    setReportSections([...reportSections, newSection]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setReportSections(reportSections.filter(s => s.id !== sectionId));
  };

  const handleGenerateReport = async () => {
    if (!reportTitle) {
      toast({
        variant: 'destructive',
        description: 'Please enter a report title.'
      });
      return;
    }

    if (selectedMetrics.length === 0) {
      toast({
        variant: 'destructive',
        description: 'Please select at least one metric.'
      });
      return;
    }

    toast({
      title: 'Report Generated',
      description: 'Your custom report has been created successfully.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Report Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create tailored reports with AI-powered insights and recommendations
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
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
              <CardDescription>Set up your report structure and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportTitle">Report Title</Label>
                <Input
                  id="reportTitle"
                  placeholder="e.g., Monthly Performance Review"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger id="reportType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue Report</SelectItem>
                      <SelectItem value="customer">Customer Report</SelectItem>
                      <SelectItem value="usage">Usage Report</SelectItem>
                      <SelectItem value="custom">Custom Report</SelectItem>
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
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Selected Metrics ({selectedMetrics.length})</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[80px]">
                  {selectedMetrics.map(metric => (
                    <Badge key={metric} variant="secondary" className="gap-1">
                      {metric}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveMetric(metric)}
                      />
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
                  {availableMetrics
                    .filter(m => !selectedMetrics.includes(m))
                    .map(metric => (
                      <Badge
                        key={metric}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleAddMetric(metric)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {metric}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Sections */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Report Sections</CardTitle>
                  <CardDescription>Organize your metrics into sections</CardDescription>
                </div>
                <Button onClick={handleAddSection} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportSections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sections yet. Add sections to organize your report.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportSections.map((section, index) => (
                    <div key={section.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={section.name}
                          onChange={(e) => {
                            const updated = [...reportSections];
                            updated[index].name = e.target.value;
                            setReportSections(updated);
                          }}
                          className="max-w-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSection(section.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Visualization Type</Label>
                          <Select
                            value={section.visualizationType}
                            onValueChange={(value: any) => {
                              const updated = [...reportSections];
                              updated[index].visualizationType = value;
                              setReportSections(updated);
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="chart">Chart</SelectItem>
                              <SelectItem value="table">Table</SelectItem>
                              <SelectItem value="graph">Graph</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Metrics ({section.metrics.length})</Label>
                          <div className="text-xs text-muted-foreground">
                            {section.metrics.join(', ') || 'None selected'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleGenerateReport} className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              Save Template
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* AI Wizard Sidebar */}
        {showAIWizard && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  AI Wizard
                </CardTitle>
                <CardDescription>
                  Get AI-powered recommendations for your report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiQuery">What insights do you need?</Label>
                  <Textarea
                    id="aiQuery"
                    placeholder="e.g., I want to understand my revenue trends and identify growth opportunities"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
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
                {/* AI Insights */}
                {aiRecommendations.insights && aiRecommendations.insights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Key Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {aiRecommendations.insights.map((insight, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* AI Recommendations */}
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

                {/* Suggested Metrics */}
                {aiRecommendations.suggestedMetrics && aiRecommendations.suggestedMetrics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Suggested Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiRecommendations.suggestedMetrics.slice(0, 5).map((metric, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between gap-2 p-2 rounded border hover:bg-accent cursor-pointer"
                            onClick={() => handleAddMetric(metric.name)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{metric.name}</div>
                              <div className="text-xs text-muted-foreground">{metric.description}</div>
                            </div>
                            <Badge variant={metric.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                              {metric.priority}
                            </Badge>
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
