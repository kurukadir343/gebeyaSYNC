-- =====================================================================
-- GebeyaSync schema: run this whole file once in Supabase → SQL Editor.
-- Tenant model: one store per user. Every data row carries store_id and
-- is protected by Row Level Security, so isolation is enforced by the
-- database itself, not only by application code.
-- =====================================================================

-- ---------- Stores ----------
create table public.stores (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null unique references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now()
);

-- Returns the store id of the signed-in user. SECURITY DEFINER so it can be
-- used inside RLS policies without recursion.
create or replace function public.current_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.stores where owner_id = auth.uid() limit 1
$$;

revoke all on function public.current_store_id() from public, anon;
grant execute on function public.current_store_id() to authenticated;

-- ---------- Products ----------
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores(id) on delete cascade,
  name                text not null check (char_length(name) between 1 and 100),
  price               numeric(12,2) not null check (price >= 0),
  stock               integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_at          timestamptz not null default now(),
  unique (id, store_id)
);
create index products_store_idx on public.products(store_id);

-- ---------- Customers ----------
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 100),
  phone      text check (phone is null or char_length(phone) <= 30),
  created_at timestamptz not null default now(),
  unique (id, store_id)
);
create index customers_store_idx on public.customers(store_id);

-- ---------- Sales ----------
-- Composite foreign keys (id, store_id) guarantee a row can never point at
-- another shop's customer, product or sale.
create table public.sales (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  customer_id  uuid,
  payment_type text not null check (payment_type in ('cash', 'credit')),
  total        numeric(12,2) not null default 0 check (total >= 0),
  created_at   timestamptz not null default now(),
  unique (id, store_id),
  foreign key (customer_id, store_id) references public.customers(id, store_id)
);
create index sales_store_date_idx on public.sales(store_id, created_at desc);

create table public.sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null,
  store_id     uuid not null references public.stores(id) on delete cascade,
  product_id   uuid not null,
  product_name text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(12,2) not null check (unit_price >= 0),
  foreign key (sale_id, store_id) references public.sales(id, store_id) on delete cascade,
  foreign key (product_id, store_id) references public.products(id, store_id)
);
create index sale_items_sale_idx on public.sale_items(sale_id);

-- ---------- Credit ledger ----------
create table public.credit_entries (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null,
  sale_id     uuid,
  amount      numeric(12,2) not null check (amount > 0),
  note        text check (note is null or char_length(note) <= 200),
  status      text not null default 'open' check (status in ('open', 'paid')),
  created_at  timestamptz not null default now(),
  paid_at     timestamptz,
  foreign key (customer_id, store_id) references public.customers(id, store_id),
  foreign key (sale_id, store_id) references public.sales(id, store_id)
);
create index credit_store_status_idx on public.credit_entries(store_id, status);
create index credit_customer_idx on public.credit_entries(customer_id);

-- ---------- Row Level Security ----------
alter table public.stores         enable row level security;
alter table public.products       enable row level security;
alter table public.customers      enable row level security;
alter table public.sales          enable row level security;
alter table public.sale_items     enable row level security;
alter table public.credit_entries enable row level security;

create policy "owner can read own store" on public.stores
  for select to authenticated using (owner_id = auth.uid());
create policy "owner can create own store" on public.stores
  for insert to authenticated with check (owner_id = auth.uid());
create policy "owner can update own store" on public.stores
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "tenant isolation" on public.products
  for all to authenticated
  using (store_id = public.current_store_id())
  with check (store_id = public.current_store_id());

create policy "tenant isolation" on public.customers
  for all to authenticated
  using (store_id = public.current_store_id())
  with check (store_id = public.current_store_id());

create policy "tenant isolation" on public.credit_entries
  for all to authenticated
  using (store_id = public.current_store_id())
  with check (store_id = public.current_store_id());

-- Sales and their line items are an audit trail: readable by the owner,
-- written only through record_sale() below (no direct insert/update/delete).
create policy "tenant read" on public.sales
  for select to authenticated using (store_id = public.current_store_id());
create policy "tenant read" on public.sale_items
  for select to authenticated using (store_id = public.current_store_id());

-- Nothing is exposed to anonymous visitors.
revoke all on public.stores, public.products, public.customers,
              public.sales, public.sale_items, public.credit_entries from anon;

-- ---------- Create a store automatically on sign-up ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stores (owner_id, name)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'store_name'), 100), ''), 'My Shop')
  )
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Atomic sale ----------
-- One transaction: validates the cart, decrements stock (never below zero),
-- logs the sale and its items, and opens a credit entry for credit sales.
-- Prices come from the products table, never from the client.
-- The store is derived from auth.uid(), never accepted as a parameter.
create or replace function public.record_sale(
  p_items        jsonb,
  p_payment_type text,
  p_customer_id  uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store uuid := public.current_store_id();
  v_sale  uuid;
  v_total numeric(12,2) := 0;
  v_item  jsonb;
  v_pid   uuid;
  v_qty   integer;
  v_name  text;
  v_price numeric(12,2);
begin
  if v_store is null then
    raise exception 'No store found for this account';
  end if;
  if p_payment_type not in ('cash', 'credit') then
    raise exception 'Invalid payment type';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The sale has no items';
  end if;

  if p_payment_type = 'credit' then
    if p_customer_id is null then
      raise exception 'Choose a customer for a credit sale';
    end if;
    if not exists (select 1 from customers where id = p_customer_id and store_id = v_store) then
      raise exception 'Customer not found';
    end if;
  else
    p_customer_id := null;
  end if;

  insert into sales (store_id, customer_id, payment_type, total)
  values (v_store, p_customer_id, p_payment_type, 0)
  returning id into v_sale;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity';
    end if;

    update products
       set stock = stock - v_qty
     where id = v_pid
       and store_id = v_store
       and stock >= v_qty
    returning name, price into v_name, v_price;

    if not found then
      select name into v_name from products where id = v_pid and store_id = v_store;
      raise exception 'Not enough stock for %', coalesce(v_name, 'an unknown product');
    end if;

    insert into sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price)
    values (v_sale, v_store, v_pid, v_name, v_qty, v_price);

    v_total := v_total + v_price * v_qty;
  end loop;

  update sales set total = v_total where id = v_sale and store_id = v_store;

  if p_payment_type = 'credit' then
    insert into credit_entries (store_id, customer_id, sale_id, amount, note)
    values (v_store, p_customer_id, v_sale, v_total, 'Credit sale');
  end if;

  return v_sale;
end;
$$;

revoke all on function public.record_sale(jsonb, text, uuid) from public, anon;
grant execute on function public.record_sale(jsonb, text, uuid) to authenticated;
