import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="card p-8 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
      <p className="mt-3 text-sm text-slate-500">
        Use the &ldquo;Forgot password?&rdquo; link on the sign-in page — Clerk will send a
        secure reset email to your registered address.
      </p>
      <Link
        href="/sign-in"
        className="btn-primary mt-6 inline-block"
      >
        Back to Sign In
      </Link>
    </div>
  );
}
