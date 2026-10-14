import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type StoreRow = { id: string; name: string };

/**
 * Single entry point for every authenticated server page and action.
 * Returns the Supabase client plus the signed-in user's store id.
 * Every query in the app filters by this storeId (and RLS enforces it again).
 */
export const requireStore = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let store: StoreRow | null = null;

  const existing = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();
  store = existing.data as StoreRow | null;

  if (!store) {
    // Fallback for accounts created before the sign-up trigger existed.
    const name = (user.user_metadata?.store_name as string | undefined)?.slice(0, 100) || "My Shop";
    const created = await supabase
      .from("stores")
      .insert({ owner_id: user.id, name })
      .select("id, name")
      .maybeSingle();
    store = created.data as StoreRow | null;

    if (!store) {
      const retry = await supabase
        .from("stores")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();
      store = retry.data as StoreRow | null;
    }
  }

  if (!store) throw new Error("Could not load your shop. Please try again.");

  return { supabase, user, storeId: store.id, storeName: store.name };
});
