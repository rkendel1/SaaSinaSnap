export default function RecommendationsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Recommendations</h1>
        <p className="text-gray-600">
          Personalized suggestions to optimize your platform and increase conversions.
        </p>
      </div>

      <div className="space-y-6">
        {/* High Priority Recommendations */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
            <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-medium">HIGH PRIORITY</span>
            Product Setup Incomplete
          </h3>
          <p className="text-red-800 text-sm mb-4">
            You haven&apos;t added any products yet. This is preventing you from making sales. 
            Based on your business type, we recommend starting with 2-3 core products.
          </p>
          <div className="flex gap-3">
            <a href="/creator/dashboard/products/new" className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm">
              Add Your First Product
            </a>
            <button className="text-red-600 hover:text-red-700 text-sm">View Examples</button>
          </div>
        </div>

        {/* Medium Priority Recommendations */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
            <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium">MEDIUM PRIORITY</span>
            Storefront Branding
          </h3>
          <p className="text-yellow-800 text-sm mb-4">
            Your storefront is using default styling. Customizing it to match your brand can increase trust and conversions by up to 30%.
          </p>
          <div className="flex gap-3">
            <a href="/creator/storefront/customize" className="bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors text-sm">
              Customize Storefront
            </a>
            <button className="text-yellow-600 hover:text-yellow-700 text-sm">See Examples</button>
          </div>
        </div>

        {/* Low Priority Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-medium">LOW PRIORITY</span>
            Integration Opportunities
          </h3>
          <p className="text-blue-800 text-sm mb-4">
            Connect analytics and notification tools to better understand your business performance and stay informed about important events.
          </p>
          <div className="flex gap-3">
            <a href="/creator/dashboard/integrations" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Browse Integrations
            </a>
            <button className="text-blue-600 hover:text-blue-700 text-sm">Learn More</button>
          </div>
        </div>

        {/* Growth Opportunities */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">GROWTH</span>
            Embed Opportunities
          </h3>
          <p className="text-green-800 text-sm mb-4">
            Create embeddable widgets to promote your products on external websites and social media. This can drive additional traffic and sales.
          </p>
          <div className="flex gap-3">
            <a href="/embed-preview" className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm">
              Create Embeds
            </a>
            <button className="text-green-600 hover:text-green-700 text-sm">View Templates</button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">🤖 AI Insights</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-2">Business Type Analysis</h4>
            <p className="text-gray-700 text-sm">
              Based on your business type, similar creators see the highest success with subscription-based products 
              and integrated email marketing. Consider these for your next optimization phase.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-2">Market Timing</h4>
            <p className="text-gray-700 text-sm">
              Your launch timing is excellent. Similar businesses launched in this period show 25% higher 
              first-month conversion rates compared to other seasons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}