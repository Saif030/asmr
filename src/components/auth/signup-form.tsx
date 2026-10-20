"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    inviteCode: "",
  });
  const [loading, setLoading] = React.useState(false);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload.error ?? "Could not create the account.");
        setLoading(false);
        return;
      }

      toast.success(
        payload.isAdmin
          ? "Welcome! You are the first member, so you are the admin."
          : "Welcome to Khatmal Coaching!",
      );
      router.replace("/home");
      router.refresh();
    } catch {
      toast.error("Network error — check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          required
          placeholder="Aisha Khan"
          value={form.name}
          onChange={update("name")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={form.email}
          onChange={update("email")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update("password")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inviteCode" className="flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-foreground-subtle" />
          Invite code
        </Label>
        <Input
          id="inviteCode"
          required
          placeholder="Ask your friends for the code"
          value={form.inviteCode}
          onChange={update("inviteCode")}
        />
        <p className="text-xs text-foreground-subtle">
          This hub is invite-only. Without the code, signup is refused.
        </p>
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        Create account
      </Button>
    </form>
  );
}
