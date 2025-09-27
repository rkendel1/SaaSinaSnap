import Link from 'next/link';
import { Search, Home, UserPlus, ArrowRight } from 'lucide-react';

export default function CreatorNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Creator Not Found</h1>
            <p className="text-lg text-gray-600 mb-6">
              The creator page you&apos;re looking for doesn&apos;t exist or may have been moved.
            </p>
          </div>

          {/* Helpful suggestions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">What you can do:</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Check the URL for any typos or spelling errors</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>The creator may have changed their page URL or paused their storefront</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Try searching for the creator on our discovery page</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {/* Primary Action */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors group"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </Link>

          {/* Browse Creators */}
          <Link
            href="/c"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors group"
          >
            <Search className="h-4 w-4" />
            <span>Browse Creators</span>
          </Link>

          {/* Creator Signup */}
          <Link
            href="/creator/signup"
            className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors group"
          >
            <UserPlus className="h-4 w-4" />
            <span>Become a Creator</span>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Need help? We&apos;re here to assist you.
          </p>
          <Link
            href="mailto:support@saasinasnap.com"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            Contact Support
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}