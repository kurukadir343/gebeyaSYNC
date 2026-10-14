import { LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Stripe from "@/components/Stripe";
import { requireStore } from "@/lib/store";
import { logout } from "../(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { storeName } = await requireStore();

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-28">
      <Stripe />
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="truncate font-display text-lg font-bold text-brand-dark">{storeName}</p>
        <form action={logout}>
          <button type="submit" className="btn btn-outline btn-sm" aria-label="Log out">
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        </form>
      </header>
      <main className="px-4">{children}</main>
      <BottomNav />
    </div>
  );
}
