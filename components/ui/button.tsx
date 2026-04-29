import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border-2 border-foreground bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/35 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.22)] [a]:hover:border-foreground [a]:hover:bg-primary/88 hover:bg-primary/90 hover:shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.12)] dark:shadow-[inset_0_0_0_1px_oklch(0_0_0_/_0.2)] dark:hover:shadow-[inset_0_0_0_1px_oklch(0_0_0_/_0.12)]",
        outline:
          "border-foreground bg-background text-foreground shadow-[inset_0_0_0_1px_oklch(0_0_0_/_0.05)] hover:bg-accent/40 hover:text-foreground aria-expanded:bg-accent/25 aria-expanded:text-foreground dark:bg-background/80 dark:shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.06)] dark:hover:bg-accent/25",
        secondary:
          "border-foreground bg-secondary text-secondary-foreground shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.35)] hover:bg-secondary/88 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground dark:shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.08)]",
        ghost:
          "border-transparent bg-transparent text-foreground shadow-none hover:border-foreground/55 hover:bg-muted/80 hover:shadow-[inset_0_0_0_1px_oklch(0_0_0_/_0.04)] aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.06)] dark:hover:bg-muted/50",
        destructive:
          "border-foreground bg-destructive/10 text-destructive shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.14)] hover:border-foreground hover:bg-destructive/18 focus-visible:ring-destructive/30 dark:bg-destructive/18 dark:shadow-[inset_0_0_0_1px_oklch(0_0_0_/_0.12)] dark:hover:bg-destructive/28 dark:focus-visible:ring-destructive/35",
        link: "rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-0 text-primary shadow-none hover:border-foreground/60 hover:bg-transparent hover:underline focus-visible:ring-0",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-xs in-data-[slot=button-group]:rounded-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 text-[0.9375rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
