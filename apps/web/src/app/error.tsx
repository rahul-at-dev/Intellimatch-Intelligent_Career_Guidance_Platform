"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 font-bold text-xl mb-4 border border-rose-200/60">
        !
      </div>
      <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
      <p className="mt-2 text-xs text-slate-500 max-w-sm">
        An unexpected error occurred. You can try refreshing the view or navigating home.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="btn-primary text-xs px-4 py-2"
        >
          Try Again
        </button>
        <Link href="/" className="btn-secondary text-xs px-4 py-2">
          Back Home
        </Link>
      </div>
    </div>
  );
}
