export default function TestEmbedPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Embed Test Page</h1>
        <p className="text-gray-600 mb-8">
          This page demonstrates how the embed script works. In a real implementation, 
          this would be on an external website.
        </p>

        {/* Test Inline Embed */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Inline Embed Example</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              This content will be replaced by the embedded page:
            </p>
            <div 
              data-staryer-embed 
              data-creator="demo-creator" 
              data-mode="inline" 
              data-page="landing"
              className="border-2 border-dashed border-gray-300 p-4 min-h-[200px] flex items-center justify-center"
            >
              <span className="text-gray-400">Loading embed content...</span>
            </div>
          </div>
        </section>

        {/* Test Iframe Embed */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Iframe Embed Example</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              This will load as an iframe:
            </p>
            <div 
              data-staryer-embed 
              data-creator="demo-creator" 
              data-mode="iframe" 
              data-page="landing"
              data-height="600px"
              className="border border-gray-300 rounded"
            >
              <span className="text-gray-400">Loading iframe embed...</span>
            </div>
          </div>
        </section>

        {/* Test Custom Styled Embed */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Custom Styled Embed</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              This embed has custom styles applied:
            </p>
            <div 
              data-staryer-embed 
              data-creator="demo-creator" 
              data-mode="inline" 
              data-page="landing"
              data-custom-styles="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
              className="min-h-[200px]"
            >
              <span className="text-gray-400">Loading styled embed...</span>
            </div>
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Usage Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Include the embed script: <code className="bg-blue-100 px-1 rounded">&lt;script src="/embed.js"&gt;&lt;/script&gt;</code></li>
            <li>Add embed containers with the appropriate data attributes</li>
            <li>The script will automatically initialize when the page loads</li>
            <li>Check browser console for any error messages</li>
          </ol>
        </section>
      </div>

      {/* Load the embed script */}
      <script src="/embed.js" async></script>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Embed Test Page - Staryer',
    description: 'Test page for the Staryer embed functionality',
  };
}