import Link from 'next/link';

export default function CreatorNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Creator Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The creator page you're looking for doesn't exist or may have been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          <div>
            <Link
              href="/creator/signup"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Are you a creator? Sign up here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}