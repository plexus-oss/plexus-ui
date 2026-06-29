import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** Diameter in pixels. @default 24 */
  size?: number;
  className?: string;
}

/**
 * Centered loading spinner. Use this for any loading / Suspense fallback —
 * never skeleton or pulse loaders.
 */
export function Spinner({ size = 24, className }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-zinc-500 dark:text-zinc-400", className)}
      size={size}
      aria-label="Loading"
    />
  );
}

/** A spinner centered inside a sized container — ideal for 3D/visual loaders. */
export function CenteredSpinner({
  height = 500,
  label,
  className,
}: {
  height?: number | string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950",
        className
      )}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <Spinner size={28} />
      {label && <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>}
    </div>
  );
}
