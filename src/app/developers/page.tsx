import Link from 'next/link';
import { ArrowRight, Book, Code, FileText, Key, Rocket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DeveloperResources() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Developer Resources
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to integrate with the Staryer Platform. 
            Get started quickly with our comprehensive guides, examples, and tools.
          </p>
        </div>

        {/* Quick Start Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold">Generate API Key</h3>
                <p className="text-sm text-muted-foreground">
                  Create your testing API key with just your email address
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/docs">Get API Key</Link>
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold">Explore APIs</h3>
                <p className="text-sm text-muted-foreground">
                  Test our endpoints interactively in the documentation
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/docs#endpoints">View Endpoints</Link>
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold">Start Building</h3>
                <p className="text-sm text-muted-foreground">
                  Integrate with your application using our SDKs and examples
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="#sdks">See Examples</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                API Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Complete OpenAPI specification with interactive testing tools and code examples.
              </p>
              <Button asChild className="w-full">
                <Link href="/docs">
                  View Documentation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-600" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Secure API key management system with rate limiting and usage tracking.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/docs?tab=authentication">
                  Manage API Keys
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-600" />
                Code Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ready-to-use code snippets and integration examples for popular languages.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="#examples">
                  Browse Examples
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-orange-600" />
                Tutorials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Step-by-step guides for common integration scenarios and use cases.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="#tutorials">
                  View Tutorials
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Join our developer community for support, discussions, and updates.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="#community">
                  Join Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-indigo-600" />
                SDKs & Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Official SDKs and development tools to accelerate your integration.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="#sdks">
                  Download SDKs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Code Examples Section */}
        <Card className="mb-8" id="examples">
          <CardHeader>
            <CardTitle>Integration Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">JavaScript/Node.js</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <pre>{`// Extract branding data
const response = await fetch('/api/enhanced-extraction', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

const data = await response.json();
console.log(data.data.brandColor);`}</pre>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Python</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <pre>{`import requests

# Extract branding data
response = requests.post(
    '/api/enhanced-extraction',
    headers={
        'X-API-Key': 'your_api_key',
        'Content-Type': 'application/json'
    },
    json={'url': 'https://example.com'}
)

data = response.json()
print(data['data']['brandColor'])`}</pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Documentation</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Comprehensive guides and API reference
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/docs">Read Docs</Link>
                </Button>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Connect with other developers
                </p>
                <Button variant="outline" size="sm">
                  Join Discord
                </Button>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Book className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Support</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get direct help from our team
                </p>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}