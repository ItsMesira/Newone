import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost" | "link" | "danger" | "success"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Using a simple switch statement for variants instead of cva to avoid dependency issue,
    // though cva is better if installed. We will do standard tailwind template literals.
    const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
    
    const variants = {
      default: "bg-primary text-primary-foreground shadow hover:bg-primary-hover",
      outline: "border border-[rgba(255,255,255,0.1)] bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-foreground",
      ghost: "hover:bg-[rgba(255,255,255,0.05)] text-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      danger: "bg-danger text-danger-foreground hover:bg-danger/90",
      success: "bg-success text-success-foreground hover:bg-success/90"
    }

    const sizes = {
      default: "h-11 px-6 py-2",
      sm: "h-9 rounded-xl px-4 text-xs",
      lg: "h-14 rounded-2xl px-8 text-base",
      icon: "h-11 w-11",
    }

    return (
      <Comp
        className={cn(baseClass, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
