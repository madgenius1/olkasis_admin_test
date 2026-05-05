import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-lg">O</span>
        </div>

        {/* Error */}
        <p className="text-7xl font-black text-slate-200 select-none mb-4">404</p>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8">
          This page doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}