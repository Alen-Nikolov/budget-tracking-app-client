import Link from "next/link";
import ResendForm from "@/components/ResendForm";

export default async function EmailVerified({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;

  return (
    <main className="center">
      <div className="card auth">
        {status === "success" ? (
          <>
            <h1>Email verified</h1>
            <p>Your email address is confirmed. You can now log in.</p>
            <Link href="/login" className="btn primary">Go to log in</Link>
          </>
        ) : status === "expired" ? (
          <>
            <h1>Link expired</h1>
            <p>This verification link has expired. Enter your email to get a new one.</p>
            <ResendForm />
            <p className="hint"><Link href="/login">Back to log in</Link></p>
          </>
        ) : (
          <>
            <h1>Invalid link</h1>
            <p>This verification link isn’t valid. It may have been replaced by a newer one.</p>
            <p className="hint">
              Try logging in — we’ll offer to resend the email if needed. <Link href="/login">Log in</Link> ·{" "}
              <Link href="/register">Register</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
