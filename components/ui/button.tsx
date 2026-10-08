import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] font-mono text-[14px] font-medium whitespace-nowrap transition-all duration-150 ease-[var(--ease-out)] outline-none focus-visible:shadow-[var(--shadow-focus)] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand-fill text-brand-on-fill hover:opacity-90",
        accent:
          "bg-brand-fill text-brand-on-fill hover:opacity-90",
        destructive:
          "bg-danger text-white hover:opacity-90",
        outline:
          "border-[1.5px] border-brand-primary bg-transparent text-brand-primary hover:bg-brand-light",
        secondary:
          "bg-brand-light text-brand-dark hover:bg-brand-secondary/25",
        ghost:
          "bg-transparent text-text-secondary hover:bg-surface-raised hover:text-text-primary",
        link: "text-brand-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-11 px-6 py-3 has-[>svg]:px-5",
        xs: "h-6 gap-1 rounded-[var(--radius-sm)] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-[14px] has-[>svg]:px-3",
        lg: "h-12 px-7 text-[16px] has-[>svg]:px-5",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-5",
        "icon-xs": "size-7 rounded-[var(--radius-sm)] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
