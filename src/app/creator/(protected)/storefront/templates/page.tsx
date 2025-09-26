export default function StorefrontTemplatesPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Storefront Templates</h1>
        <p className="text-gray-600">
          Choose from pre-designed templates to quickly customize your storefront appearance.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="mb-4">
          <div className="h-12 w-12 bg-gray-200 rounded-lg mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Templates Coming Soon</h3>
          <p className="text-gray-600 mb-6">
            We&apos;re working on a collection of professional templates for your storefront. 
            For now, you can customize your storefront using our design tools.
          </p>
          <div className="flex gap-3 justify-center">
            <a 
              href="/creator/storefront/customize"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Customize Storefront
            </a>
            <a 
              href="/creator/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}