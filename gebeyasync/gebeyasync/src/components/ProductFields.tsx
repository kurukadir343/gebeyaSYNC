import type { Product } from "@/lib/types";

export default function ProductFields({ product }: { product?: Product }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="label">Product name</label>
        <input id="name" name="name" required maxLength={100} defaultValue={product?.name} className="input" placeholder="e.g. Sugar 1kg" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className="label">Price (ETB)</label>
          <input id="price" name="price" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={product?.price} className="input" />
        </div>
        <div>
          <label htmlFor="stock" className="label">In stock</label>
          <input id="stock" name="stock" type="number" inputMode="numeric" step="1" min="0" required defaultValue={product?.stock ?? 0} className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="low_stock_threshold" className="label">Warn me when stock is at or below</label>
        <input id="low_stock_threshold" name="low_stock_threshold" type="number" inputMode="numeric" step="1" min="0" defaultValue={product?.low_stock_threshold ?? 5} className="input" />
      </div>
    </div>
  );
}
