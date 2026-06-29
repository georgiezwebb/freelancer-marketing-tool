"use client";

import * as React from "react";
import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  inUse: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  onToggle: (nextInUse: boolean) => boolean | void | Promise<boolean | void>;
};

export function VersionInUseStar({
  inUse,
  disabled = false,
  size = "md",
  className,
  onToggle,
}: Props) {
  const [pending, setPending] = React.useState(false);
  const iconClass = size === "sm" ? "size-3.5" : "size-4";

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || pending) return;
    setPending(true);
    try {
      const ok = await onToggle(!inUse);
      if (ok === false) {
        window.alert(
          "Could not update. Run npm run db:push locally if the database schema is out of date."
        );
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      aria-label={inUse ? "Unmark as in use" : "Mark as in use"}
      aria-pressed={inUse}
      title={inUse ? "Currently in use" : "Mark as in use"}
      onClick={handleClick}
      className={cn(
        "shrink-0 rounded-sm border-2 border-transparent p-0.5 transition-colors",
        "hover:border-foreground/30 hover:bg-background/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      <StarIcon
        className={cn(
          iconClass,
          inUse
            ? "fill-amber-400 text-amber-500"
            : "text-muted-foreground/60 hover:text-muted-foreground"
        )}
        aria-hidden
      />
    </button>
  );
}
