import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  iconClassName?: string;
  compact?: boolean;
};

/** Text wordmark with a small book icon — used in the sidebar and top bar. */
export function Wordmark({ className, iconClassName, compact = false }: WordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent",
          iconClassName,
        )}
      >
        <BookOpen className="h-4 w-4" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Khatmal Coaching
        </span>
      )}
    </span>
  );
}
