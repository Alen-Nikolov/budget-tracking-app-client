import Link from "next/link";
import ResendForm from "@/components/ResendForm";

export default async function CheckYourEmail({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; unverified?: string }>;
}) {
  const { email, unverified } = await searchParams;
  return (
    <main className="center">
      <div className="card auth">
        <h1>Please verify your email address</h1>
        {unverified !== undefined && (
          <p className="notice">Your email address hasn’t been verified yet, so you can’t log in.</p>
        )}
        <p>
          We’ve sent a verification link{email ? <> to <strong>{email}</strong></> : ""}. Click it to activate your
          account — you’ll then be redirected to the login page. The link is valid for 24 hours.
        </p>
        <p className="hint">Didn’t get it? Check your spam folder, or request a new link (this invalidates the old one).</p>
        <ResendForm email={email} />
        <p className="hint"><Link href="/login">Back to log in</Link></p>
      </div>
    </main>
  );
}
