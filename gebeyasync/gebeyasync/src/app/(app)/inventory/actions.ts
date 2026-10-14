"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStore } from "@/lib/store";

type ParsedProduct = {
  name: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
};

function parseProduct(formData: FormData): ParsedProduct | string {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const thresholdRaw = String(formData.get("low_stock_threshold") ?? "").trim();
  const threshold = thresholdRaw === "" ? 5 : Number(thresholdRaw);

  if (!name) return "Enter a product name.";
  if (name.length > 100) return "Product name is too long.";
  if (!Number.isFinite(price) || price < 0 || price > 100_000_000) return "Enter a valid price.";
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return "Stock must be a whole number, 0 or more.";
  if (!Number.isInteger(threshold) || threshold < 0) return "Low-stock level must be a whole number, 0 or more.";

  return {
    name,
    price: Math.round(price * 100) / 100,
    stock,
    low_stock_threshold: threshold,
  };
}

export async function addProduct(formData: FormData) {
  const { supabase, storeId } = await requireStore();
  const parsed = parseProduct(formData);

  if (typeof parsed === "string") redirect(`/inventory?error=${encodeURIComponent(parsed)}`);

  const { error } = await supabase.from("products").insert({ store_id: storeId, ...parsed });
  if (error) redirect(`/inventory?error=${encodeURIComponent("Could not save the product. Try again.")}`);

  revalidatePath("/inventory");
  revalidatePath("/");
  revalidatePath("/sales");
  redirect("/inventory");
}

export async function updateProduct(productId: string, formData: FormData) {
  const { supabase, storeId } = await requireStore();
  const parsed = parseProduct(formData);

  if (typeof parsed === "string") {
    redirect(`/inventory/${productId}?error=${encodeURIComponent(parsed)}`);
  }

  const { data, error } = await supabase
    .from("products")
    .update(parsed)
    .eq("id", productId)
    .eq("store_id", storeId)
    .select("id");

  if (error || !data || data.length === 0) {
    redirect(`/inventory/${productId}?error=${encodeURIComponent("Could not save changes. Try again.")}`);
  }

  revalidatePath("/inventory");
  revalidatePath("/");
  revalidatePath("/sales");
  redirect("/inventory");
}
