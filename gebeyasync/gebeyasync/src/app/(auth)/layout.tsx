import Stripe from "@/components/Stripe";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <Stripe className="h-2" />
      <div className="flex flex-1 flex-col justify-center px-5 py-10">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-dark">
          GebeyaSync
        </h1>
        <p className="mb-8 mt-1 text-ink/70">Your shop&apos;s stock, sales and credit in one place.</p>
        {children}
      </div>
    </div>
  );
}
