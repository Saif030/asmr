import { Suspense } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { Wordmark } from "@/components/layout/wordmark";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="px-5 pt-8 sm:px-8">
        <Wordmark />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-foreground-muted">
              Sign in to your private study hub.
            </p>
          </div>

          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-sm text-foreground-muted">
            Got an invite code?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>

      <footer className="px-5 pb-8 text-center text-xs text-foreground-subtle sm:px-8">
        <p className="inline-flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Built for study groups of 5–30 friends.
        </p>
      </footer>
    </div>
  );
}
