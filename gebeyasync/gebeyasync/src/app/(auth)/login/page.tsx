import Link from "next/link";
import Alert from "@/components/Alert";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="space-y-4">
      <h2 className="page-title">Log in</h2>
      {error && <Alert kind="error">{error}</Alert>}
      {message && <Alert kind="success">{message}</Alert>}

      <form action={login} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        <button type="submit" className="btn btn-primary w-full">Log in</button>
      </form>

      <p className="text-center text-sm text-ink/70">
        New shop?{" "}
        <Link href="/signup" className="font-semibold text-brand underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
