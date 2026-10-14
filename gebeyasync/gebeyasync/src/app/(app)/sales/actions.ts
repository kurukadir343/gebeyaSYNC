"use server";

import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store";

export type SaleInput = {
  items: { product_id: string; quantity: number }[];
  paymentType: "cash" | "credit";
  customerId?: string;
};

export type SaleResult = { ok: true; total?: number } | { ok: false; error: string };

export async function recordSale(input: SaleInput): Promise<SaleResult> {
  const { supabase } = await requireStore(); // rejects unauthenticated callers

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Add at least one product." };
  }
  if (input.items.length > 100) return { ok: false, error: "Too many items in one sale." };
  if (input.paymentType !== "cash" && input.paymentType !== "credit") {
    return { ok: false, error: "Choose cash or credit." };
  }
  for (const it of input.items) {
    if (typeof it.product_id !== "string" || !Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 100000) {
      return { ok: false, error: "Invalid item in the sale." };
    }
  }
  if (input.paymentType === "credit" && !input.customerId) {
    return { ok: false, error: "Choose a customer for a credit sale." };
  }

  // The database function derives the store from the signed-in user, reads
  // prices from the products table, and updates stock atomically.
  const { error } = await supabase.rpc("record_sale", {
    p_items: input.items,
    p_payment_type: input.paymentType,
    p_customer_id: input.paymentType === "credit" ? input.customerId : null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/credit");
  return { ok: true };
}
