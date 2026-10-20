import type { ReactNode } from "react";

/** Consistent page padding + heading block for every app screen. */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className ?? ""}`}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-foreground-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 ${className ?? ""}`}>
      {children}
    </div>
  );
}
