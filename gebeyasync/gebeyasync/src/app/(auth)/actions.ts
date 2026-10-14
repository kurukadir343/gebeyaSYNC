"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) fail("/login", "Enter your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) fail("/login", "Wrong email or password.");
  redirect("/");
}

export async function signup(formData: FormData) {
  const storeName = String(formData.get("store_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!storeName) fail("/signup", "Enter your shop name.");
  if (storeName.length > 100) fail("/signup", "Shop name is too long.");
  if (!email) fail("/signup", "Enter your email.");
  if (password.length < 8) fail("/signup", "Password must be at least 8 characters.");

  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { store_name: storeName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) fail("/signup", error.message);

  // With email confirmation on, there is no session until the link is clicked.
  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent("Check your email and tap the confirmation link, then log in.")}`
    );
  }
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
