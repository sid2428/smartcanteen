"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { ROUTES, ROLE_HOME } from "@/lib/constants";
import type { Role } from "@/lib/domain";

type User = { id: string; name: string; role: Role } | null;

const studentLinks = [
  { href: ROUTES.menu, label: "Menu", icon: "🍽️" },
  { href: ROUTES.orders, label: "Orders", icon: "📋" },
  { href: ROUTES.tickets, label: "Tickets", icon: "🎫" },
];

const staffLinks = [
  { href: ROUTES.kitchen, label: "Kitchen", icon: "👨‍🍳" },
  { href: ROUTES.scan, label: "Scan QR", icon: "📷" },
];

const ownerLinks = [
  { href: ROUTES.owner, label: "Dashboard", icon: "📊" },
  { href: ROUTES.ownerDishes, label: "Dishes", icon: "🍛" },
  { href: ROUTES.kitchen, label: "Kitchen", icon: "👨‍🍳" },
  { href: ROUTES.scan, label: "Scan QR", icon: "📷" },
  { href: ROUTES.ownerSettings, label: "Settings", icon: "⚙️" },
  { href: ROUTES.ownerRefunds, label: "Refunds", icon: "💰" },
];

function linksForRole(role: Role) {
  if (role === "owner") return ownerLinks;
  if (role === "staff") return staffLinks;
  return studentLinks;
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api<{ user: User }>("/api/auth/me").then((d) => setUser(d.user)).catch(() => {});
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links = user ? linksForRole(user.role) : [];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={user ? ROLE_HOME[user.role] : "/login"} className="text-lg font-bold text-orange-600">
          🍽️ Smart Canteen
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === l.href || pathname.startsWith(l.href + "/")
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {l.icon} {l.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={logout}
              className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="border-t border-zinc-200 bg-white px-4 pb-4 pt-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === l.href
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400"
              }`}
            >
              {l.icon} {l.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={logout}
              className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400"
            >
              Sign out ({user.name})
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
