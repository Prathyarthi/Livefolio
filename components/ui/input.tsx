import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-3.5 py-1 text-[15px] text-text-primary transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary placeholder:text-text-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-brand-primary focus-visible:shadow-[var(--shadow-focus)]",
        "aria-invalid:border-danger",
        className
      )}
      {...props}
    />
  )
}

export { Input }
