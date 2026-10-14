import Link from "next/link";
import Alert from "@/components/Alert";
import { signup } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-4">
      <h2 className="page-title">Create your shop account</h2>
      {error && <Alert kind="error">{error}</Alert>}

      <form action={signup} className="space-y-4">
        <div>
          <label htmlFor="store_name" className="label">Shop name</label>
          <input id="store_name" name="store_name" type="text" maxLength={100} required className="input" placeholder="e.g. Abebe Mini Market" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password (8+ characters)</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" />
        </div>
        <button type="submit" className="btn btn-primary w-full">Create account</button>
      </form>

      <p className="text-center text-sm text-ink/70">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
