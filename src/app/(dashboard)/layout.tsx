"use client";

import { CartProvider } from "@/lib/cart-context";
import { AppNav } from "@/components/app-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </CartProvider>
  );
}
