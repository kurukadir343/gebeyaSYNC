import Link from "next/link";
import { UserPlus } from "lucide-react";
import Alert from "@/components/Alert";
import { requireStore } from "@/lib/store";
import { money } from "@/lib/format";
import { addCustomer } from "./actions";

export default async function CreditPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, storeId } = await requireStore();

  const [customersRes, openRes] = await Promise.all([
    supabase.from("customers").select("id, name, phone").eq("store_id", storeId),
    supabase
      .from("credit_entries")
      .select("customer_id, amount")
      .eq("store_id", storeId)
      .eq("status", "open"),
  ]);

  const owed = new Map<string, number>();
  for (const e of openRes.data ?? []) {
    owed.set(e.customer_id, (owed.get(e.customer_id) ?? 0) + Number(e.amount));
  }

  const customers = (customersRes.data ?? [])
    .map((c) => ({ ...c, balance: owed.get(c.id) ?? 0 }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));

  const totalOwed = customers.reduce((s, c) => s + c.balance, 0);

  return (
    <div className="space-y-4 pt-2">
      <h1 className="page-title">Credit ledger</h1>
      {error && <Alert kind="error">{error}</Alert>}

      <section className="panel border-l-4 border-l-brick">
        <p className="text-sm text-ink/70">Total owed to you</p>
        <p className="font-display text-3xl font-extrabold text-brick-dark">{money(totalOwed)}</p>
      </section>

      <details className="panel" open={customers.length === 0 || !!error}>
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 font-semibold text-brand-dark">
          <UserPlus size={20} aria-hidden="true" />
          Add a customer
        </summary>
        <form action={addCustomer} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input id="name" name="name" required maxLength={100} className="input" />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone (optional)</label>
            <input id="phone" name="phone" type="tel" inputMode="tel" maxLength={30} className="input" />
          </div>
          <button type="submit" className="btn btn-primary w-full">Save customer</button>
        </form>
      </details>

      {customers.length === 0 ? (
        <p className="text-ink/70">No customers yet. Add the first one above.</p>
      ) : (
        <ul className="space-y-2">
          {customers.map((c) => (
            <li key={c.id}>
              <Link href={`/credit/${c.id}`} className="panel flex items-center justify-between gap-3 hover:bg-sage/50">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.name}</p>
                  {c.phone && <p className="text-sm text-ink/70">{c.phone}</p>}
                </div>
                {c.balance > 0 ? (
                  <span className="shrink-0 font-display font-bold text-brick-dark">{money(c.balance)}</span>
                ) : (
                  <span className="chip shrink-0 bg-brand-light text-brand-dark">Settled</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
