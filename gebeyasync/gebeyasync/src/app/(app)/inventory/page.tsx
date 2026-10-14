import Link from "next/link";
import { Plus } from "lucide-react";
import Alert from "@/components/Alert";
import ProductFields from "@/components/ProductFields";
import { requireStore } from "@/lib/store";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { addProduct } from "./actions";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, storeId } = await requireStore();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  const products = (data ?? []) as Product[];

  return (
    <div className="space-y-4 pt-2">
      <h1 className="page-title">Stock</h1>
      {error && <Alert kind="error">{error}</Alert>}

      <details className="panel group" open={products.length === 0 || !!error}>
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 font-semibold text-brand-dark">
          <Plus size={20} aria-hidden="true" />
          Add a product
        </summary>
        <form action={addProduct} className="mt-4 space-y-4">
          <ProductFields />
          <button type="submit" className="btn btn-primary w-full">Save product</button>
        </form>
      </details>

      {products.length === 0 ? (
        <p className="text-ink/70">No products yet. Add your first one above.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => {
            const out = p.stock === 0;
            const low = !out && p.stock <= p.low_stock_threshold;
            return (
              <li key={p.id}>
                <Link href={`/inventory/${p.id}`} className="panel flex items-center justify-between gap-3 hover:bg-sage/50">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-sm text-ink/70">{money(p.price)}</p>
                  </div>
                  <span
                    className={`chip shrink-0 ${
                      out
                        ? "bg-brick-light text-brick-dark"
                        : low
                        ? "bg-sun-light text-sun-dark"
                        : "bg-brand-light text-brand-dark"
                    }`}
                  >
                    {out ? "Out of stock" : `${p.stock} in stock`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
