export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbfbfe] px-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-semibold">
            I
          </div>
          <span className="font-semibold text-slate-900">IntelliMatch AI</span>
        </div>
        {children}
      </div>
    </div>
  );
}
