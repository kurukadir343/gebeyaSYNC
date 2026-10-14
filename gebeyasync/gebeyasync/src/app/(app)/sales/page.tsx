import SaleForm from "@/components/SaleForm";
import { requireStore } from "@/lib/store";
import { dateTime, money } from "@/lib/format";

export default async function SalesPage() {
  const { supabase, storeId } = await requireStore();

  const [productsRes, customersRes, recentRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, stock")
      .eq("store_id", storeId)
      .gt("stock", 0)
      .order("name", { ascending: true }),
    supabase
      .from("customers")
      .select("id, name")
      .eq("store_id", storeId)
      .order("name", { ascending: true }),
    supabase
      .from("sales")
      .select("id, total, payment_type, created_at, customer_id")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const products = (productsRes.data ?? []).map((p) => ({ ...p, price: Number(p.price) }));
  const customers = customersRes.data ?? [];
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  const recent = (recentRes.data ?? []) as {
    id: string;
    total: number;
    payment_type: "cash" | "credit";
    created_at: string;
    customer_id: string | null;
  }[];

  return (
    <div className="space-y-6 pt-2">
      <h1 className="page-title">Record a sale</h1>
      <SaleForm products={products} customers={customers} />

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Recent sales</h2>
        {recent.length === 0 ? (
          <p className="text-ink/70">Sales you record will show up here.</p>
        ) : (
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/15 bg-white">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{money(s.total)}</p>
                  <p className="truncate text-sm text-ink/70">
                    {dateTime(s.created_at)}
                    {s.customer_id && nameById.get(s.customer_id) ? ` · ${nameById.get(s.customer_id)}` : ""}
                  </p>
                </div>
                <span className={`chip shrink-0 ${s.payment_type === "cash" ? "bg-brand-light text-brand-dark" : "bg-brick-light text-brick-dark"}`}>
                  {s.payment_type === "cash" ? "Cash" : "Credit"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
