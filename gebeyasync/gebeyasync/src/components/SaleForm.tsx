"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { money } from "@/lib/format";
import { recordSale } from "@/app/(app)/sales/actions";

type P = { id: string; name: string; price: number; stock: number };
type C = { id: string; name: string };

export default function SaleForm({ products, customers }: { products: P[]; customers: C[] }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<"cash" | "credit">("cash");
  const [customerId, setCustomerId] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ p: byId.get(id), qty }))
    .filter((l): l is { p: P; qty: number } => !!l.p);

  const total = lines.reduce((sum, l) => sum + l.p.price * l.qty, 0);

  function setQty(id: string, qty: number) {
    const p = byId.get(id);
    if (!p) return;
    setMsg(null);
    setCart((prev) => {
      const next = { ...prev };
      const q = Math.min(qty, p.stock);
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await recordSale({
        items: lines.map((l) => ({ product_id: l.p.id, quantity: l.qty })),
        paymentType: payment,
        customerId: payment === "credit" ? customerId : undefined,
      });
      if (res.ok) {
        setCart({});
        setCustomerId("");
        setMsg({ kind: "ok", text: `Sale saved: ${money(total)}.` });
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  const canSubmit =
    lines.length > 0 && !pending && (payment === "cash" || customerId !== "");

  return (
    <div className="space-y-4">
      {msg && (
        <div
          role={msg.kind === "err" ? "alert" : "status"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            msg.kind === "ok"
              ? "border-brand/40 bg-brand-light text-brand-dark"
              : "border-brick/40 bg-brick-light text-brick-dark"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a product"
          aria-label="Find a product"
          className="input pl-10"
        />
      </div>

      {products.length === 0 ? (
        <p className="text-ink/70">
          Nothing in stock to sell. <Link href="/inventory" className="font-semibold text-brand underline">Add stock</Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const qty = cart[p.id] ?? 0;
            return (
              <li key={p.id} className={`panel flex items-center justify-between gap-3 ${qty > 0 ? "border-brand bg-brand-light/50" : ""}`}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-sm text-ink/70">
                    {money(p.price)} · {p.stock} left
                  </p>
                </div>
                {qty === 0 ? (
                  <button type="button" onClick={() => setQty(p.id, 1)} className="btn btn-primary btn-sm shrink-0" aria-label={`Add ${p.name}`}>
                    <Plus size={18} aria-hidden="true" /> Add
                  </button>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setQty(p.id, qty - 1)} className="btn btn-outline btn-sm w-10 px-0" aria-label={`Remove one ${p.name}`}>
                      <Minus size={18} aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center font-display text-lg font-bold" aria-live="polite">{qty}</span>
                    <button type="button" onClick={() => setQty(p.id, qty + 1)} disabled={qty >= p.stock} className="btn btn-outline btn-sm w-10 px-0" aria-label={`Add one more ${p.name}`}>
                      <Plus size={18} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {filtered.length === 0 && <li className="text-ink/70">No product matches &ldquo;{query}&rdquo;.</li>}
        </ul>
      )}

      {lines.length > 0 && (
        <section className="panel space-y-4 border-ink/30">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold">This sale</h2>
            <p className="font-display text-2xl font-extrabold">{money(total)}</p>
          </div>

          <fieldset>
            <legend className="label">How is the customer paying?</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "credit"] as const).map((type) => (
                <label
                  key={type}
                  className={`btn cursor-pointer border ${
                    payment === type ? "border-brand bg-brand text-white" : "border-ink/25 bg-white text-ink"
                  }`}
                >
                  <input type="radio" name="payment" value={type} checked={payment === type} onChange={() => setPayment(type)} className="sr-only" />
                  {type === "cash" ? "Cash" : "On credit"}
                </label>
              ))}
            </div>
          </fieldset>

          {payment === "credit" && (
            <div>
              <label htmlFor="customer" className="label">Who owes this?</label>
              {customers.length === 0 ? (
                <p className="text-sm text-ink/70">
                  No customers yet. <Link href="/credit" className="font-semibold text-brand underline">Add a customer</Link> first.
                </p>
              ) : (
                <select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input">
                  <option value="">Choose a customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button type="button" onClick={submit} disabled={!canSubmit} className="btn btn-primary w-full">
            {pending ? "Saving…" : `Save sale · ${money(total)}`}
          </button>
        </section>
      )}
    </div>
  );
}
