'use client';

import { useState } from 'react';
import { MessageSquare, Star, ThumbsUp, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Feedback {
  id: string;
  creatorId: string;
  creatorName: string;
  rating: number;
  category: 'onboarding' | 'features' | 'support' | 'general';
  feedback: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  status: 'new' | 'reviewed' | 'resolved';
}

export function CreatorFeedbackDashboard() {
  const [feedbackList] = useState<Feedback[]>([
    {
      id: '1',
      creatorId: 'creator-1',
      creatorName: 'Sarah Tech',
      rating: 5,
      category: 'onboarding',
      feedback: 'The onboarding process was smooth and intuitive! Loved the AI-powered branding.',
      sentiment: 'positive',
      createdAt: '2024-01-15T10:30:00Z',
      status: 'reviewed'
    },
    {
      id: '2',
      creatorId: 'creator-2',
      creatorName: 'Mike Designer',
      rating: 4,
      category: 'features',
      feedback: 'Great platform overall. Would love to see more customization options for the storefront.',
      sentiment: 'positive',
      createdAt: '2024-01-14T15:20:00Z',
      status: 'new'
    },
    {
      id: '3',
      creatorId: 'creator-3',
      creatorName: 'Emma Coach',
      rating: 3,
      category: 'support',
      feedback: 'Had some issues with Stripe Connect setup. Documentation could be clearer.',
      sentiment: 'neutral',
      createdAt: '2024-01-13T09:15:00Z',
      status: 'resolved'
    }
  ]);

  const stats = {
    totalFeedback: feedbackList.length,
    averageRating: (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1),
    positive: feedbackList.filter(f => f.sentiment === 'positive').length,
    needsAction: feedbackList.filter(f => f.status === 'new').length
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-lg">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creator Feedback</h1>
          <p className="text-gray-600">Monitor and respond to creator feedback</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold">{stats.totalFeedback}</p>
              </div>
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.averageRating} ⭐</p>
              </div>
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Positive</p>
                <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
              </div>
              <ThumbsUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Action</p>
                <p className="text-2xl font-bold text-red-600">{stats.needsAction}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="positive">Positive</TabsTrigger>
              <TabsTrigger value="needs-attention">Needs Attention</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {feedbackList.map((feedback) => (
                <div key={feedback.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{feedback.creatorName}</h3>
                        <Badge className={getSentimentColor(feedback.sentiment)}>
                          {feedback.sentiment}
                        </Badge>
                        <Badge className={getStatusColor(feedback.status)}>
                          {feedback.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span className="capitalize">{feedback.category}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          {Array.from({ length: feedback.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700">{feedback.feedback}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Reply</Button>
                    <Button variant="outline" size="sm">Mark Resolved</Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="new" className="space-y-4 mt-4">
              {feedbackList.filter(f => f.status === 'new').map((feedback) => (
                <div key={feedback.id} className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-gray-700">{feedback.feedback}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="positive" className="space-y-4 mt-4">
              {feedbackList.filter(f => f.sentiment === 'positive').map((feedback) => (
                <div key={feedback.id} className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-gray-700">{feedback.feedback}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="needs-attention" className="space-y-4 mt-4">
              {feedbackList.filter(f => f.sentiment === 'negative' || f.rating <= 3).map((feedback) => (
                <div key={feedback.id} className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-gray-700">{feedback.feedback}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
