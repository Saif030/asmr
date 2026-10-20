import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-foreground-muted">
        <FileQuestion className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Not found</h1>
        <p className="text-sm text-foreground-muted">
          That page does not exist, or it was removed by a member.
        </p>
      </div>
      <Link
        href="/home"
        className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground shadow-subtle transition-colors hover:bg-accent-hover"
      >
        Back to home
      </Link>
    </div>
  );
}
