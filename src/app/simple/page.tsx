import Link from 'next/link';

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Email Subject Line Tester
          </h1>
          <p className="text-lg text-gray-300">
            Test your email subject lines with AI-powered suggestions
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">
            🚀 Deployment Status
          </h2>
          <div className="space-y-2 text-gray-300">
            <p>✅ Next.js App Router working</p>
            <p>✅ Tailwind CSS working</p>
            <p>✅ Server-side rendering working</p>
            <p>✅ Routing working</p>
          </div>
          
          <div className="mt-6">
            <Link 
              href="/" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Main App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
