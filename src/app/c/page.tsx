import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

// This would typically come from a database query
const featuredCreators = [
  {
    id: 'tech-innovator',
    business_name: 'TechFlow Solutions',
    business_description: 'Cutting-edge software solutions for modern businesses',
    business_logo_url: null,
    brand_color: '#ea580c',
    custom_domain: 'tech-innovator', // Field name from database
    subscriber_count: 1250,
    featured: true,
    category: 'Technology'
  },
  {
    id: 'design-studio',
    business_name: 'Creative Design Studio',
    business_description: 'Beautiful design templates and creative resources',
    business_logo_url: null,
    brand_color: '#7c3aed',
    custom_domain: 'design-studio', // Field name from database
    subscriber_count: 890,
    featured: true,
    category: 'Design'
  },
  {
    id: 'fitness-coach',
    business_name: 'Peak Fitness Coaching',
    business_description: 'Personal training and nutrition programs',
    business_logo_url: null,
    brand_color: '#16a34a',
    custom_domain: 'fitness-coach', // Field name from database
    subscriber_count: 2100,
    featured: true,
    category: 'Health & Fitness'
  },
  {
    id: 'business-mentor',
    business_name: 'Growth Mentor',
    business_description: 'Business coaching and entrepreneurship courses',
    business_logo_url: null,
    brand_color: '#dc2626',
    custom_domain: 'business-mentor', // Field name from database
    subscriber_count: 756,
    featured: true,
    category: 'Business'
  },
];

export default function CreatorDirectoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-6 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Community</h1>
              <p className="text-gray-600 mt-1">SaaS in a Snap - Connect with amazing creators and their offerings</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 lg:px-6 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-orange-100 rounded-full">
              <Users className="h-12 w-12 text-orange-600" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Join Our Growing Creator Community
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with talented creators, discover new products and services, and find inspiration for your next purchase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-orange-600 hover:bg-orange-700"
              asChild
            >
              <Link href="/creator/onboarding">
                Become a Creator
              </Link>
            </Button>
            <Button 
              size="lg"
              variant="outline"
              asChild
            >
              <Link href="#featured-creators">
                Browse Creators
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section id="featured-creators" className="px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Creators</h2>
            <p className="text-xl text-gray-600">
              Hand-picked creators offering exceptional products and services
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {featuredCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-white rounded-lg border hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {creator.business_logo_url ? (
                      <Image
                        src={creator.business_logo_url}
                        alt={creator.business_name}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: creator.brand_color }}
                      >
                        {creator.business_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {creator.business_name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{creator.category}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {creator.subscriber_count.toLocaleString()} subscribers
                        </div>
                      </div>
                    </div>
                  </div>
                  {creator.featured && (
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  )}
                </div>

                <p className="text-gray-600 mb-6 line-clamp-2">
                  {creator.business_description}
                </p>

                <div className="flex items-center justify-between">
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: creator.brand_color }}
                  >
                    {creator.category}
                  </div>
                  <Link href={`/c/${creator.custom_domain}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="group"
                    >
                      Visit Creator
                      <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4 py-16 lg:px-6 bg-gray-100">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Start Your Creator Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of creators who are building successful businesses on our platform.
          </p>
          <Button 
            size="lg"
            className="bg-orange-600 hover:bg-orange-700"
            asChild
          >
            <Link href="/creator/onboarding">
              Get Started Today
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-gray-600">
            © 2024 Creator Community. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}