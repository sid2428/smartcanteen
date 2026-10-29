"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api-client";
import { safeNextPath } from "@/lib/auth-redirect";
import { ROLE_HOME } from "@/lib/constants";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import type { Role } from "@/lib/domain";

const ROLE_ICON: Record<Role, string> = { student: "🎓", staff: "👨‍🍳", owner: "📊" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const from = safeNextPath(useSearchParams().get("from"));
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(email: string, password: string, key: string) {
    setBusy(key);
    setError(null);
    try {
      const data = await api<{ user: { name: string; role: Role } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      toast(`Welcome, ${data.user.name}!`, "success");
      router.push(from ?? ROLE_HOME[data.user.role]);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setBusy(null);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    void signIn(email, password, "form");
  }

  async function resetDemo() {
    setBusy("reset");
    setError(null);
    try {
      await api("/api/demo/reset", { method: "POST" });
      toast("Demo data restored", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset demo data");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Try a demo account</h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">One click, no sign-up needed.</p>
        <div className="flex flex-col gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={busy !== null}
              onClick={() => signIn(a.email, DEMO_PASSWORD, a.id)}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-left transition-colors hover:border-orange-400 hover:bg-orange-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-orange-950/20"
            >
              <span className="text-2xl" aria-hidden>{ROLE_ICON[a.role]}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                  {busy === a.id ? "Signing in…" : `${a.role} · ${a.name}`}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">{a.blurb}</span>
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={resetDemo}
          disabled={busy !== null}
          className="mt-3 w-full text-center text-xs text-zinc-400 hover:text-orange-600 disabled:opacity-50"
        >
          {busy === "reset" ? "Resetting…" : "↺ Reset demo data"}
        </button>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Sign in</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}
          <Input name="email" label="Email" type="email" placeholder="you@college.edu" autoComplete="email" required />
          <Input
            name="password"
            label="Password"
            type="password"
            placeholder="••••••"
            autoComplete="current-password"
            required
          />
          <Button type="submit" disabled={busy !== null} className="w-full">
            {busy === "form" ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-orange-600 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
