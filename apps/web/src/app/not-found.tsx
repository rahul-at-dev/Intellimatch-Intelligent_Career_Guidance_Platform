import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fcfbfe] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-600 mb-4 shadow-sm border border-brand-200/50">
        404
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn-primary mt-6 text-xs px-5 py-2.5">
        Back to Home
      </Link>
    </div>
  );
}
