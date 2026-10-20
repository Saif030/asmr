import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";
import { Wordmark } from "@/components/layout/wordmark";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="px-5 pt-8 sm:px-8">
        <Wordmark />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Join the group
            </h1>
            <p className="text-sm text-foreground-muted">
              Invite-only. Enter the code your friends shared with you.
            </p>
          </div>

          <SignupForm />

          <p className="mt-6 text-center text-sm text-foreground-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
