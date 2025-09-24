import { Container } from '@/components/container';

export default function EmbedDocsPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Embed Integration Documentation</h1>
          <p className="text-lg text-gray-600">
            Learn how to embed your white-labeled pages directly into your existing website.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <p className="text-gray-600 mb-6">
            Get your branded pages embedded in minutes with our JavaScript embed script.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3">1. Include the Embed Script</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
              {`<script src="https://yourapp.com/embed.js"></script>`}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">2. Add the Embed Container</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
              {`<div data-staryer-embed 
     data-creator="your-creator-slug" 
     data-mode="inline" 
     data-page="landing">
</div>`}
            </div>
          </div>
        </section>

        {/* Configuration Options */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Configuration Options</h2>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Required Attributes</h3>
              <div className="space-y-3">
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded">data-staryer-embed</code>
                  <p className="text-sm text-gray-600 mt-1">Identifies the container as an embed element.</p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded">data-creator</code>
                  <p className="text-sm text-gray-600 mt-1">Your creator slug or custom domain.</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Optional Attributes</h3>
              <div className="space-y-3">
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded">data-mode</code>
                  <p className="text-sm text-gray-600 mt-1">
                    Embed mode: <code>inline</code> (default) or <code>iframe</code>
                  </p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded">data-page</code>
                  <p className="text-sm text-gray-600 mt-1">
                    Page to embed: <code>landing</code> (default), <code>pricing</code>, etc.
                  </p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded">data-height</code>
                  <p className="text-sm text-gray-600 mt-1">
                    Fixed height for iframe mode (e.g., <code>600px</code>)
                  </p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded">data-width</code>
                  <p className="text-sm text-gray-600 mt-1">
                    Container width (e.g., <code>100%</code> or <code>800px</code>)
                  </p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded">data-custom-styles</code>
                  <p className="text-sm text-gray-600 mt-1">
                    Additional CSS styles to apply to the embedded content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Embed Modes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Embed Modes</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Inline Mode</h3>
              <p className="text-gray-600 mb-4">
                Content is inserted directly into your page HTML and inherits your site&apos;s styles.
              </p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                {`<div data-staryer-embed 
     data-creator="creator-slug" 
     data-mode="inline">
</div>`}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <strong>Pros:</strong> Native look, inherits site styles<br />
                <strong>Cons:</strong> Potential style conflicts
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Iframe Mode</h3>
              <p className="text-gray-600 mb-4">
                Content is loaded in an isolated iframe with consistent styling.
              </p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                {`<div data-staryer-embed 
     data-creator="creator-slug" 
     data-mode="iframe">
</div>`}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <strong>Pros:</strong> Isolated, consistent styling<br />
                <strong>Cons:</strong> Less native integration
              </div>
            </div>
          </div>
        </section>

        {/* Styling & Customization */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Styling & Customization</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Custom Styles</h3>
              <p className="text-gray-600 mb-3">
                Apply custom styles to the embedded content using the <code>data-custom-styles</code> attribute:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                {`<div data-staryer-embed 
     data-creator="creator-slug" 
     data-custom-styles="font-family: Arial; color: #333;">
</div>`}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">CSS Targeting</h3>
              <p className="text-gray-600 mb-3">
                Target embedded content with CSS selectors (inline mode only):
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                {`.staryer-embed-inline[data-creator="your-creator"] {
  /* Your custom styles here */
  font-family: your-font;
  border-radius: 8px;
}`}
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Content Not Loading</h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Check that the embed script is loaded before the container</li>
                <li>• Verify your creator slug is correct</li>
                <li>• Ensure your pages are published and active</li>
                <li>• Check browser console for errors</li>
              </ul>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Style Conflicts (Inline Mode)</h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Use iframe mode for complete isolation</li>
                <li>• Apply specific CSS selectors to override conflicts</li>
                <li>• Use <code>!important</code> declarations sparingly</li>
                <li>• Consider CSS namespacing for your site styles</li>
              </ul>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Iframe Height Issues</h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Use <code>data-height</code> attribute to set fixed height</li>
                <li>• Auto-resize is attempted but may not work cross-origin</li>
                <li>• Consider using inline mode for dynamic sizing</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Advanced Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Advanced Usage</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">JavaScript API</h3>
              <p className="text-gray-600 mb-3">
                Access the embed API programmatically:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                {`// Initialize all embeds manually
StaryerEmbed.init();

// Initialize a specific element
const element = document.querySelector('[data-staryer-embed]');
StaryerEmbed.initElement(element);

// Check version
console.log(StaryerEmbed.version);`}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Multiple Embeds</h3>
              <p className="text-gray-600 mb-3">
                You can have multiple embeds on the same page:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                {`<!-- Landing page embed -->
<div data-staryer-embed 
     data-creator="creator-slug" 
     data-page="landing">
</div>

<!-- Pricing page embed -->
<div data-staryer-embed 
     data-creator="creator-slug" 
     data-page="pricing">
</div>`}
              </div>
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Complete Examples</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Inline Embed</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                {`<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Site</h1>
    
    <!-- Staryer Embed -->
    <div data-staryer-embed 
         data-creator="my-store" 
         data-mode="inline">
    </div>
    
    <script src="https://yourapp.com/embed.js"></script>
</body>
</html>`}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Styled Iframe with Fixed Height</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                {`<div data-staryer-embed 
     data-creator="my-store" 
     data-mode="iframe"
     data-height="800px"
     data-width="100%"
     style="border: 2px solid #e5e7eb; border-radius: 8px;">
</div>

<script src="https://yourapp.com/embed.js"></script>`}
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Support</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800">
              Need help with your embed integration? 
              <a href="mailto:support@example.com" className="font-medium underline">
                Contact our support team
              </a> or check out our 
              <a href="/docs" className="font-medium underline">
                comprehensive documentation
              </a>.
            </p>
          </div>
        </section>
      </div>
    </Container>
  );
}

export async function generateMetadata() {
  return {
    title: 'Embed Integration Documentation - Staryer',
    description: 'Learn how to embed your white-labeled pages directly into your existing website with our JavaScript embed script.',
    openGraph: {
      title: 'Embed Integration Documentation - Staryer',
      description: 'Learn how to embed your white-labeled pages directly into your existing website with our JavaScript embed script.',
    },
  };
}