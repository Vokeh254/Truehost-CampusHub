import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer whitespace-nowrap",
  {
    variants: {
      variant: {
        default:     "bg-[#3b5bdb] text-white hover:bg-[#2f4ac4] shadow-sm",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
        outline:     "border border-[#dde3f0] bg-white text-[#374151] hover:bg-[#f5f7ff]",
        secondary:   "bg-[#f0f3fb] text-[#374151] hover:bg-[#e5eaf8]",
        ghost:       "text-[#374151] hover:bg-[#f0f3fb]",
        link:        "text-[#3b5bdb] underline-offset-4 hover:underline",
        success:     "bg-[#0d9f6e] text-white hover:bg-[#0a8a5f] shadow-sm",
      },
      size: {
        default: "h-8 px-3.5 py-0 text-xs rounded-lg gap-1.5",
        sm:      "h-7 px-2.5 py-0 text-xs rounded-md gap-1",
        lg:      "h-9 px-4 py-0 text-sm rounded-lg gap-2",
        icon:    "h-7 w-7 rounded-lg p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-3 w-3 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export { Button, buttonVariants };
