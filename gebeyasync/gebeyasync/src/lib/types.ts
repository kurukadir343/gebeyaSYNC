export type Product = {
  id: string;
  store_id: string;
  name: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  created_at: string;
};

export type Customer = {
  id: string;
  store_id: string;
  name: string;
  phone: string | null;
  created_at: string;
};

export type CreditEntry = {
  id: string;
  store_id: string;
  customer_id: string;
  sale_id: string | null;
  amount: number;
  note: string | null;
  status: "open" | "paid";
  created_at: string;
  paid_at: string | null;
};

export type Sale = {
  id: string;
  store_id: string;
  customer_id: string | null;
  payment_type: "cash" | "credit";
  total: number;
  created_at: string;
};
