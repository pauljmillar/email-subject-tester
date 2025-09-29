export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          🎉 Deployment Test Successful!
        </h1>
        <p className="text-gray-300 text-lg">
          If you can see this page, your Vercel deployment is working correctly.
        </p>
        <a 
          href="/" 
          className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Main App
        </a>
      </div>
    </div>
  );
}
