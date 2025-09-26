export default function IntegrationsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
        <p className="text-gray-600">
          Connect your favorite tools and services to automate your workflows.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Slack Integration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold">S</span>
            </div>
            <h3 className="font-semibold text-gray-900">Slack</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Get notifications about new customers, sales, and important events.
          </p>
          <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
            Connect Slack
          </button>
        </div>

        {/* Zapier Integration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-semibold">Z</span>
            </div>
            <h3 className="font-semibold text-gray-900">Zapier</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Connect to 5000+ apps and automate your business workflows.
          </p>
          <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
            Connect Zapier
          </button>
        </div>

        {/* Analytics Integration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">GA</span>
            </div>
            <h3 className="font-semibold text-gray-900">Google Analytics</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Track detailed visitor behavior and conversion metrics.
          </p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Connect Analytics
          </button>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Integration Assistant</h3>
        <p className="text-blue-800 text-sm mb-4">
          Our AI can help you set up integrations based on your business type and needs. 
          Popular integrations for your business include automated email marketing, customer support, and inventory management.
        </p>
        <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Get AI Recommendations
        </button>
      </div>
    </div>
  );
}