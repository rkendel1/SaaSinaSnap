'use client';

import { useEffect, useState } from 'react';
import { Book, HelpCircle, MessageCircle, Phone, Search, Video, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

interface SupportResource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'template' | 'integration';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  popularity: number;
  url?: string;
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  lastUpdated: string;
}

interface CreatorProgress {
  currentMilestone: string;
  completedSteps: number;
  totalSteps: number;
  suggestedActions: string[];
  blockers: string[];
}

export function EnhancedCreatorSupport() {
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [progress, setProgress] = useState<CreatorProgress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupportData();
  }, []);

  const loadSupportData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockResources: SupportResource[] = [
        {
          id: '1',
          title: 'Setting Up Your First Product',
          description: 'Complete guide to creating and configuring your first SaaS product',
          type: 'article',
          category: 'Getting Started',
          difficulty: 'beginner',
          estimatedTime: '10 min',
          popularity: 95,
          url: '/help/first-product',
        },
        {
          id: '2',
          title: 'Stripe Connect Integration Walkthrough',
          description: 'Step-by-step video guide for connecting your Stripe account',
          type: 'video',
          category: 'Payments',
          difficulty: 'beginner',
          estimatedTime: '15 min',
          popularity: 88,
          url: '/help/stripe-setup',
        },
        {
          id: '3',
          title: 'Advanced Pricing Strategies',
          description: 'Optimize your pricing tiers for maximum conversion',
          type: 'article',
          category: 'Marketing',
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          popularity: 76,
        },
        {
          id: '4',
          title: 'White-Label Customization Templates',
          description: 'Pre-built templates for customizing your customer-facing pages',
          type: 'template',
          category: 'Design',
          difficulty: 'beginner',
          estimatedTime: '5 min',
          popularity: 82,
        },
        {
          id: '5',
          title: 'Webhook Integration Guide',
          description: 'Integrate with third-party services using webhooks',
          type: 'integration',
          category: 'Technical',
          difficulty: 'advanced',
          estimatedTime: '30 min',
          popularity: 64,
        },
      ];

      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          title: 'Stripe webhook not triggering',
          description: 'My webhook endpoint is not receiving Stripe events',
          status: 'in_progress',
          priority: 'high',
          category: 'Technical',
          createdAt: '2024-01-15T10:30:00Z',
          lastUpdated: '2024-01-15T14:20:00Z',
        },
        {
          id: '2',
          title: 'Custom domain setup help',
          description: 'Need assistance setting up my custom domain',
          status: 'open',
          priority: 'medium',
          category: 'Configuration',
          createdAt: '2024-01-14T16:45:00Z',
          lastUpdated: '2024-01-14T16:45:00Z',
        },
      ];

      const mockProgress: CreatorProgress = {
        currentMilestone: 'Complete Stripe Integration',
        completedSteps: 7,
        totalSteps: 12,
        suggestedActions: [
          'Connect your Stripe account',
          'Test a sample transaction',
          'Configure webhook endpoints',
        ],
        blockers: [
          'Stripe account verification pending',
        ],
      };

      setResources(mockResources);
      setTickets(mockTickets);
      setProgress(mockProgress);
    } catch (error) {
      console.error('Failed to load support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: SupportResource['type']) => {
    switch (type) {
      case 'article': return <Book className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'template': return <Zap className="h-4 w-4" />;
      case 'integration': return <MessageCircle className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: SupportResource['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleContactSupport = async (method: 'email' | 'chat' | 'call') => {
    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (method) {
        case 'email':
          toast({
            description: 'Support ticket created! We\'ll respond within 24 hours.',
          });
          break;
        case 'chat':
          toast({
            description: 'Live chat initiated! A support agent will be with you shortly.',
          });
          break;
        case 'call':
          toast({
            description: 'Call scheduled! We\'ll call you within the next 2 hours.',
          });
          break;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to contact support. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      {progress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Current Milestone: {progress.currentMilestone}</span>
                  <span>{progress.completedSteps}/{progress.totalSteps} steps</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(progress.completedSteps / progress.totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {progress.suggestedActions.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Suggested Next Steps:</h4>
                  <ul className="space-y-1">
                    {progress.suggestedActions.map((action, index) => (
                      <li key={index} className="text-sm text-blue-700">• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {progress.blockers.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Current Blockers:</h4>
                  <ul className="space-y-1">
                    {progress.blockers.map((blocker, index) => (
                      <li key={index} className="text-sm text-red-700">• {blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Contact */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-green-900 mb-2">Live Chat</h3>
            <p className="text-sm text-green-700 mb-4">Get instant help from our support team</p>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleContactSupport('chat')}
            >
              Start Chat
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-blue-900 mb-2">Schedule Call</h3>
            <p className="text-sm text-blue-700 mb-4">Talk to an expert about your setup</p>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleContactSupport('call')}
            >
              Book Call
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium text-purple-900 mb-2">Support Ticket</h3>
            <p className="text-sm text-purple-700 mb-4">Submit a detailed support request</p>
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => handleContactSupport('email')}
            >
              Create Ticket
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">Help Resources</TabsTrigger>
          <TabsTrigger value="tickets">My Tickets ({tickets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resources" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search help resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="Getting Started">Getting Started</option>
              <option value="Payments">Payments</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Technical">Technical</option>
            </select>
          </div>

          {/* Resources Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(resource.type)}
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className={getDifficultyColor(resource.difficulty)}>
                      {resource.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{resource.category}</span>
                    <span>{resource.estimatedTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Popularity:</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full" 
                          style={{ width: `${resource.popularity}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{resource.popularity}%</span>
                    </div>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="tickets" className="space-y-4">
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{ticket.title}</CardTitle>
                      <p className="text-sm text-gray-600">{ticket.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Category: {ticket.category}</span>
                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(ticket.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {tickets.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No Support Tickets</h3>
                  <p className="text-gray-600 mb-4">You haven't submitted any support tickets yet.</p>
                  <Button onClick={() => handleContactSupport('email')}>
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}