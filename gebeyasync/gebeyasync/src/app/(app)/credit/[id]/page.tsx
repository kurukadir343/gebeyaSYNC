import Link from "next/link";
import { notFound } from "next/navigation";
import Alert from "@/components/Alert";
import { requireStore } from "@/lib/store";
import { dateTime, money } from "@/lib/format";
import type { CreditEntry, Customer } from "@/lib/types";
import { addCredit, markAllPaid, markPaid } from "../actions";

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, storeId } = await requireStore();

  const { data: customerData } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!customerData) notFound();
  const customer = customerData as Customer;

  const { data: entryData } = await supabase
    .from("credit_entries")
    .select("*")
    .eq("customer_id", id)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  const entries = (entryData ?? []) as CreditEntry[];
  const open = entries.filter((e) => e.status === "open");
  const paid = entries.filter((e) => e.status === "paid");
  const balance = open.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4 pt-2">
      <Link href="/credit" className="text-sm font-semibold text-brand underline underline-offset-2">
        Back to ledger
      </Link>

      <div>
        <h1 className="page-title">{customer.name}</h1>
        {customer.phone && (
          <a href={`tel:${customer.phone}`} className="text-sm font-semibold text-brand underline underline-offset-2">
            {customer.phone}
          </a>
        )}
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <section className="panel border-l-4 border-l-brick">
        <p className="text-sm text-ink/70">Owes you</p>
        <p className="font-display text-3xl font-extrabold text-brick-dark">{money(balance)}</p>
        {open.length > 1 && (
          <form action={markAllPaid.bind(null, customer.id)} className="mt-3">
            <button type="submit" className="btn btn-primary w-full">Mark everything as paid</button>
          </form>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Unpaid</h2>
        {open.length === 0 ? (
          <p className="text-ink/70">Nothing unpaid. This customer is settled.</p>
        ) : (
          <ul className="space-y-2">
            {open.map((e) => (
              <li key={e.id} className="panel flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{money(e.amount)}</p>
                  <p className="truncate text-sm text-ink/70">
                    {dateTime(e.created_at)}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <form action={markPaid.bind(null, customer.id, e.id)}>
                  <button type="submit" className="btn btn-outline btn-sm shrink-0">Mark paid</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="panel">
        <summary className="min-h-10 cursor-pointer list-none py-2 font-semibold text-brand-dark">
          Add credit without a sale
        </summary>
        <form action={addCredit.bind(null, customer.id)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="amount" className="label">Amount (ETB)</label>
            <input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required className="input" />
          </div>
          <div>
            <label htmlFor="note" className="label">Note (optional)</label>
            <input id="note" name="note" maxLength={200} className="input" placeholder="e.g. Rice and oil" />
          </div>
          <button type="submit" className="btn btn-primary w-full">Add to what they owe</button>
        </form>
      </details>

      {paid.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">Paid</h2>
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/15 bg-white">
            {paid.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink/80">{money(e.amount)}</p>
                  <p className="truncate text-sm text-ink/60">
                    Paid {e.paid_at ? dateTime(e.paid_at) : ""}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <span className="chip shrink-0 bg-brand-light text-brand-dark">Paid</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
