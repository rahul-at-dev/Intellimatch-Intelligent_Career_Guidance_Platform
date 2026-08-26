"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-[#fafaff] p-6 text-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
          <button
            onClick={() => reset()}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
