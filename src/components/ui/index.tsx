// Consolidated UI components — warm brown + gold palette
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Button ───────────────────────────────────────────────
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:     "bg-brown-800 text-brown-50 hover:bg-brown-700 shadow-warm-sm",
        secondary:   "bg-brown-100 text-brown-700 hover:bg-brown-200",
        outline:     "border border-brown-200 text-brown-600 hover:bg-brown-50",
        ghost:       "text-brown-500 hover:bg-brown-100 hover:text-brown-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        gold:        "bg-gold-500 text-brown-900 hover:bg-gold-400 font-semibold shadow-gold",
        white:       "bg-white text-brown-700 hover:bg-brown-50 shadow-warm-sm border border-brown-200",
      },
      size: {
        sm:   "px-3 py-1.5 text-xs",
        default: "px-4 py-2",
        lg:   "px-6 py-3 text-base",
        icon: "w-9 h-9",
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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";

// ─── Card ──────────────────────────────────────────────────
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bg-white rounded-2xl border shadow-warm-sm", className)}
      style={{ borderColor: "#E0CBB0" }}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pb-3", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display font-semibold text-lg", className)}
      style={{ color: "#2C1A0E" }}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-5 pb-5", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 pb-5 pt-3", className)}
      style={{ borderTop: "1px solid #F0E6D3" }}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// ─── Badge ────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center rounded-full border text-xs font-semibold px-2.5 py-0.5 transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-brown-100 text-brown-700 border-brown-200",
        secondary:   "bg-warm-100 text-warm-600 border-warm-200",
        destructive: "bg-red-50 text-red-700 border-red-200",
        outline:     "border-current text-current",
        gold:        "bg-gold-100 text-gold-700 border-gold-200",
        guardian:    "bg-red-50 text-red-700 border-red-200",
        leader:      "bg-gold-100 text-gold-700 border-gold-200",
        member:      "bg-brown-100 text-brown-600 border-brown-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// ─── Input ────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm placeholder:text-brown-300 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
        className
      )}
      style={{
        borderColor: "#E0CBB0",
        color: "#3D2410",
      }}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ─── Label ────────────────────────────────────────────────
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      style={{ color: "#5C3D20" }}
      {...props}
    />
  )
);
Label.displayName = "Label";

// ─── Select ───────────────────────────────────────────────
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 cursor-pointer",
        className
      )}
      style={{ borderColor: "#E0CBB0", color: "#3D2410" }}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

// ─── Textarea ─────────────────────────────────────────────
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border bg-white px-3 py-2 text-sm placeholder:text-brown-300 focus:outline-none focus:ring-2 disabled:opacity-50 resize-none",
        className
      )}
      style={{ borderColor: "#E0CBB0", color: "#3D2410" }}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ─── Alert ────────────────────────────────────────────────
export function Alert({
  variant = "default",
  title,
  children,
  className,
}: {
  variant?: "default" | "error" | "success" | "warning";
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    default: "bg-brown-50 border-brown-200 text-brown-700",
    error:   "bg-red-50 border-red-200 text-red-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warning: "bg-gold-50 border-gold-200 text-gold-800",
  };
  return (
    <div className={cn("rounded-xl border p-4", styles[variant], className)}>
      {title && <p className="font-semibold text-sm mb-1">{title}</p>}
      <p className="text-sm">{children}</p>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className || "w-6 h-6")}
      style={{ color: "#C9A84C" }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Page header ──────────────────────────────────────────
export function PageHeader({ title, description, children }: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold" style={{ color: "#2C1A0E" }}>{title}</h1>
        {description && <p className="text-sm mt-1" style={{ color: "#9A7B5C" }}>{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(201,168,76,0.10)" }}
        >
          <Icon className="w-6 h-6" style={{ color: "#C9A84C" }} />
        </div>
      )}
      <h3 className="font-semibold mb-1" style={{ color: "#5C3D20" }}>{title}</h3>
      {description && <p className="text-sm max-w-xs" style={{ color: "#9A7B5C" }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
