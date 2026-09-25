import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-16 w-full rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-3.5 py-2.5 text-[15px] text-text-primary transition-[color,box-shadow,border-color] outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger focus-visible:border-brand-primary focus-visible:shadow-[var(--shadow-focus)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
