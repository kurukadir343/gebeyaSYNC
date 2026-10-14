"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStore } from "@/lib/store";

function refresh(customerId?: string) {
  revalidatePath("/credit");
  revalidatePath("/");
  if (customerId) revalidatePath(`/credit/${customerId}`);
}

export async function addCustomer(formData: FormData) {
  const { supabase, storeId } = await requireStore();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) redirect(`/credit?error=${encodeURIComponent("Enter the customer's name.")}`);
  if (name.length > 100) redirect(`/credit?error=${encodeURIComponent("Name is too long.")}`);
  if (phone.length > 30) redirect(`/credit?error=${encodeURIComponent("Phone number is too long.")}`);

  const { data, error } = await supabase
    .from("customers")
    .insert({ store_id: storeId, name, phone: phone || null })
    .select("id")
    .single();

  if (error || !data) redirect(`/credit?error=${encodeURIComponent("Could not save the customer. Try again.")}`);

  refresh();
  redirect(`/credit/${data.id}`);
}

export async function addCredit(customerId: string, formData: FormData) {
  const { supabase, storeId } = await requireStore();
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  const note = String(formData.get("note") ?? "").trim();
  const back = `/credit/${customerId}`;

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
    redirect(`${back}?error=${encodeURIComponent("Enter an amount greater than 0.")}`);
  }
  if (note.length > 200) redirect(`${back}?error=${encodeURIComponent("Note is too long.")}`);

  // The composite foreign key (customer_id, store_id) rejects other shops' customers.
  const { error } = await supabase.from("credit_entries").insert({
    store_id: storeId,
    customer_id: customerId,
    amount,
    note: note || null,
  });

  if (error) redirect(`${back}?error=${encodeURIComponent("Could not add the credit. Try again.")}`);

  refresh(customerId);
  redirect(back);
}

export async function markPaid(customerId: string, entryId: string) {
  const { supabase, storeId } = await requireStore();

  await supabase
    .from("credit_entries")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", entryId)
    .eq("store_id", storeId)
    .eq("customer_id", customerId)
    .eq("status", "open");

  refresh(customerId);
}

export async function markAllPaid(customerId: string) {
  const { supabase, storeId } = await requireStore();

  await supabase
    .from("credit_entries")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("store_id", storeId)
    .eq("customer_id", customerId)
    .eq("status", "open");

  refresh(customerId);
}
