export default function WebhooksPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Webhooks</h1>
        <p className="text-gray-600">
          Set up webhooks to receive real-time notifications about events in your platform.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Webhook Endpoints</h3>
            <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Add Webhook
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-gray-200 rounded-lg mx-auto mb-4"></div>
            <h4 className="font-medium text-gray-900 mb-2">No webhooks configured</h4>
            <p className="text-gray-600 text-sm mb-6">
              Get started by adding your first webhook endpoint to receive real-time notifications.
            </p>
            <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Create Your First Webhook
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">Available Events</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-700">customer.subscription.created</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-700">customer.subscription.updated</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-700">invoice.payment_succeeded</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-700">invoice.payment_failed</span>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Webhook Assistant</h3>
        <p className="text-blue-800 text-sm mb-4">
          Let our AI help you set up webhooks for common use cases like customer notifications, 
          analytics tracking, or integrating with your existing tools.
        </p>
        <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Get Setup Help
        </button>
      </div>
    </div>
  );
}