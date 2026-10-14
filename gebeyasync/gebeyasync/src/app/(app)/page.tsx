import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { requireStore } from "@/lib/store";
import { money, startOfTodayEAT } from "@/lib/format";

export default async function DashboardPage() {
  const { supabase, storeId } = await requireStore();

  const [salesRes, productsRes, creditRes] = await Promise.all([
    supabase
      .from("sales")
      .select("total, payment_type")
      .eq("store_id", storeId)
      .gte("created_at", startOfTodayEAT()),
    supabase
      .from("products")
      .select("id, name, stock, low_stock_threshold")
      .eq("store_id", storeId)
      .order("stock", { ascending: true }),
    supabase
      .from("credit_entries")
      .select("amount")
      .eq("store_id", storeId)
      .eq("status", "open"),
  ]);

  const sales = salesRes.data ?? [];
  const totalToday = sales.reduce((s, r) => s + Number(r.total), 0);
  const cashToday = sales
    .filter((r) => r.payment_type === "cash")
    .reduce((s, r) => s + Number(r.total), 0);
  const creditToday = totalToday - cashToday;

  const lowStock = (productsRes.data ?? []).filter(
    (p) => p.stock <= p.low_stock_threshold
  );

  const outstanding = (creditRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4 pt-2">
      <section className="rounded-xl bg-brand p-5 text-white">
        <p className="text-sm text-white/80">Sold today</p>
        <p className="mt-1 font-display text-4xl font-extrabold tracking-tight">{money(totalToday)}</p>
        <div className="mt-4 flex gap-6 border-t border-white/25 pt-3 text-sm">
          <p>
            <span className="text-white/75">Cash </span>
            <span className="font-semibold">{money(cashToday)}</span>
          </p>
          <p>
            <span className="text-white/75">On credit </span>
            <span className="font-semibold">{money(creditToday)}</span>
          </p>
        </div>
      </section>

      <Link href="/sales" className="btn w-full bg-ink text-white hover:bg-ink/90">
        <ShoppingCart size={20} aria-hidden="true" />
        Record a sale
      </Link>

      <section className="panel border-l-4 border-l-brick">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Customers owe you</h2>
          <Link href="/credit" className="text-sm font-semibold text-brand underline underline-offset-2">
            Open ledger
          </Link>
        </div>
        <p className="mt-1 font-display text-2xl font-bold text-brick-dark">{money(outstanding)}</p>
      </section>

      <section className="panel border-l-4 border-l-sun">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Running low</h2>
          <Link href="/inventory" className="text-sm font-semibold text-brand underline underline-offset-2">
            All stock
          </Link>
        </div>

        {lowStock.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70">Everything is stocked above its low-stock level.</p>
        ) : (
          <ul className="mt-2 divide-y divide-ink/10">
            {lowStock.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <Link href={`/inventory/${p.id}`} className="min-w-0 truncate font-medium">
                  {p.name}
                </Link>
                <span
                  className={`chip shrink-0 ${
                    p.stock === 0 ? "bg-brick-light text-brick-dark" : "bg-sun-light text-sun-dark"
                  }`}
                >
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
        {lowStock.length > 8 && (
          <p className="mt-2 text-sm text-ink/70">and {lowStock.length - 8} more in Stock.</p>
        )}
      </section>
    </div>
  );
}
