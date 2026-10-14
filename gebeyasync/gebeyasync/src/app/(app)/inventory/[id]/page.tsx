import Link from "next/link";
import { notFound } from "next/navigation";
import Alert from "@/components/Alert";
import ProductFields from "@/components/ProductFields";
import { requireStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { updateProduct } from "../actions";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, storeId } = await requireStore();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!data) notFound();
  const product = data as Product;

  return (
    <div className="space-y-4 pt-2">
      <Link href="/inventory" className="text-sm font-semibold text-brand underline underline-offset-2">
        Back to stock
      </Link>
      <h1 className="page-title">Edit product</h1>
      {error && <Alert kind="error">{error}</Alert>}

      <form action={updateProduct.bind(null, product.id)} className="panel space-y-4">
        <ProductFields product={product} />
        <button type="submit" className="btn btn-primary w-full">Save changes</button>
      </form>
    </div>
  );
}
