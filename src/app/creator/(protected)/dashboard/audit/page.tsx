export default function AuditPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Audit</h1>
        <p className="text-gray-600">
          Get AI-powered insights and recommendations to optimize your platform setup.
        </p>
      </div>

      <div className="mb-6">
        <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Run Complete Audit
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Setup Completeness */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Setup Completeness</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Products Configured</span>
              <span className="text-green-600 font-medium">✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Setup</span>
              <span className="text-green-600 font-medium">✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storefront Customized</span>
              <span className="text-yellow-600 font-medium">⚠</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Integrations Active</span>
              <span className="text-red-600 font-medium">✗</span>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Page Load Speed</span>
              <span className="text-green-600 font-medium">Good</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SEO Score</span>
              <span className="text-yellow-600 font-medium">Fair</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mobile Responsive</span>
              <span className="text-green-600 font-medium">Excellent</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-gray-600 font-medium">--</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Audit Report</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Priority Recommendations</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Complete storefront customization to improve brand consistency</li>
              <li>• Set up at least one integration (Slack or email) for better workflow</li>
              <li>• Add product images and detailed descriptions</li>
              <li>• Configure email notifications for customer interactions</li>
            </ul>
          </div>
          <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            View Detailed Report
          </button>
        </div>
      </div>
    </div>
  );
}