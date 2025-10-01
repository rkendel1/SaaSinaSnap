'use client';

import { useState } from 'react';
import { MessageSquare, Send, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface FeedbackFormProps {
  creatorId: string;
  creatorName?: string;
}

export function CreatorFeedbackForm({ creatorId, creatorName }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState<'onboarding' | 'features' | 'support' | 'general'>('general');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        variant: 'destructive',
        description: 'Please provide a rating',
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        variant: 'destructive',
        description: 'Please provide feedback',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement API call to save feedback
      const feedbackData = {
        creatorId,
        rating,
        category,
        feedback: feedback.trim(),
        createdAt: new Date().toISOString(),
      };

      console.log('Submitting feedback:', feedbackData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        description: 'Thank you for your feedback! We appreciate your input.',
      });

      // Reset form
      setRating(0);
      setCategory('general');
      setFeedback('');
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to submit feedback. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>Share Your Feedback</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Help us improve your experience on the platform
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <Label className="text-gray-900 mb-2 block">How would you rate your experience?</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Good'}
                  {rating === 3 && 'Okay'}
                  {rating === 2 && 'Poor'}
                  {rating === 1 && 'Very Poor'}
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-gray-900">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="general">General Feedback</option>
              <option value="onboarding">Onboarding Experience</option>
              <option value="features">Features & Functionality</option>
              <option value="support">Support & Documentation</option>
            </select>
          </div>

          {/* Feedback Text */}
          <div>
            <Label htmlFor="feedback" className="text-gray-900">Your Feedback</Label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience, suggestions for improvement, or any issues you've encountered..."
              rows={5}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your feedback helps us build a better platform for all creators
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
