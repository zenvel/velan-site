import Link from 'next/link';

export default function RootNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-4xl font-bold mb-6">404</h1>
      <p className="text-xl mb-8">Oops! Page not found.</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Back to homepage
      </Link>
    </div>
  );
} 