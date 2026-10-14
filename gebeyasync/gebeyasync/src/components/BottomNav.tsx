"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, Users } from "lucide-react";

const tabs = [
  { href: "/", label: "Today", icon: Home },
  { href: "/sales", label: "Sell", icon: ShoppingCart },
  { href: "/inventory", label: "Stock", icon: Package },
  { href: "/credit", label: "Credit", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/15 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? "bg-brand-light text-brand-dark" : "text-ink/60"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
