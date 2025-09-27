'use client';

import { useState } from 'react';
import { Check,Copy, Key, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function APIDocumentation() {
  const [apiKey, setApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [testUrl, setTestUrl] = useState('https://example.com');
  const [testResult, setTestResult] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const generateApiKey = async () => {
    if (!email) {
      alert('Please enter your email address to generate an API key.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, purpose: 'testing' })
      });

      const data = await response.json();
      
      if (data.success) {
        setApiKey(data.data.key);
        alert('Your API key has been generated successfully. Keep it secure!');
      } else {
        throw new Error(data.error || 'Failed to generate API key');
      }
    } catch (error) {
      alert(`Generation Failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyApiKey = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      alert('API key copied to clipboard');
    }
  };

  const testApiCall = async () => {
    if (!apiKey) {
      alert('Please generate an API key first.');
      return;
    }

    setIsTestingApi(true);
    try {
      const response = await fetch('/api/enhanced-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ url: testUrl })
      });

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        alert('Your API call was processed successfully!');
      } else {
        alert(`API Test Failed: ${data.error || 'API call failed'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`Error: ${errorMessage}`);
      alert(`Test Failed: ${errorMessage}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Staryer Platform API Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive API documentation with interactive testing capabilities. 
            Generate your API key and start building with our platform immediately.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">API Keys</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="testing">Live Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Staryer API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The Staryer Platform API provides powerful tools for SaaS creators, including:
                </p>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                  <li>Advanced URL extraction and branding analysis</li>
                  <li>Usage tracking and billing automation</li>
                  <li>Creator onboarding and management</li>
                  <li>Embed generation and customization</li>
                  <li>Real-time analytics and insights</li>
                </ul>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Getting Started</h4>
                  <p className="text-blue-800 text-sm">
                    1. Generate your API key using your email address<br/>
                    2. Include the key in your requests using the X-API-Key header<br/>
                    3. Start making API calls to our endpoints<br/>
                    4. Monitor your usage and upgrade as needed
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Generate API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={generateApiKey} 
                  disabled={isGenerating || !email}
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate API Key'}
                </Button>

                {apiKey && (
                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={apiKey} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyApiKey}
                      >
                        {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Keep this key secure! Use it in the X-API-Key header for authenticated requests.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold">GET /api/health</h4>
                    <p className="text-sm text-muted-foreground">Check API health status</p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">POST /api/enhanced-extraction</h4>
                    <p className="text-sm text-muted-foreground">Extract branding data from URL</p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold">POST /api/keys</h4>
                    <p className="text-sm text-muted-foreground">Generate new API key</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Live API Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-url">Test URL</Label>
                  <Input
                    id="test-url"
                    placeholder="https://example.com"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={testApiCall} 
                  disabled={isTestingApi || !apiKey}
                  className="w-full"
                >
                  {isTestingApi ? 'Testing...' : 'Test API Call'}
                </Button>

                {testResult && (
                  <div>
                    <Label>Response</Label>
                    <Textarea
                      value={testResult}
                      readOnly
                      className="font-mono text-sm h-48"
                    />
                  </div>
                )}

                {!apiKey && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 text-sm">
                      Generate an API key in the API Keys tab to test the API.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}