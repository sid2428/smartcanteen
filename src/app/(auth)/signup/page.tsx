"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api-client";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const collegeId = String(form.get("collegeId") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!name || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, collegeId: collegeId || undefined, password }),
      });
      toast("Account created! Welcome to Smart Canteen 🎉", "success");
      router.push("/menu");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create account</h2>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Demo mode: new accounts are removed when the demo data is reset.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}
        <Input name="name" label="Full name" placeholder="Asha Sharma" autoComplete="name" required />
        <Input name="email" label="Email" type="email" placeholder="you@college.edu" autoComplete="email" required />
        <Input name="collegeId" label="College ID (optional)" placeholder="CS-2024-001" />
        <Input
          name="password"
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
          minLength={6}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-orange-600 hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
