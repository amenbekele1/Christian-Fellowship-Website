// Consolidated UI components
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Button ───────────────────────────────────────────────
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-green-700 text-white hover:bg-green-800 shadow-sm",
        secondary: "bg-green-100 text-green-700 hover:bg-green-200",
        outline: "border border-green-200 text-green-700 hover:bg-green-50",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        gold: "bg-amber-400 text-green-900 hover:bg-amber-500 font-semibold shadow-sm",
        white: "bg-white text-green-700 hover:bg-green-50 shadow-sm",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        default: "px-4 py-2",
        lg: "px-6 py-3 text-base",
        icon: "w-9 h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
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
    );
  }
);
Button.displayName = "Button";

// ─── Card ──────────────────────────────────────────────────
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("bg-white rounded-xl border border-green-100 shadow-sm", className)} {...props} />
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
    <h3 ref={ref} className={cn("font-display font-semibold text-gray-800 text-lg", className)} {...props} />
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
    <div ref={ref} className={cn("px-5 pb-5 pt-3 border-t border-green-50", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

// ─── Badge ────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center rounded-full border text-xs font-semibold px-2.5 py-0.5 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-green-100 text-green-700 border-green-200",
        secondary: "bg-gray-100 text-gray-600 border-gray-200",
        destructive: "bg-red-100 text-red-700 border-red-200",
        outline: "border-current text-current",
        gold: "bg-amber-100 text-amber-700 border-amber-200",
        guardian: "bg-red-100 text-red-700 border-red-200",
        leader: "bg-amber-100 text-amber-700 border-amber-200",
        member: "bg-green-100 text-green-700 border-green-200",
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
        "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ─── Label ────────────────────────────────────────────────
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium text-gray-700 leading-none", className)} {...props} />
  )
);
Label.displayName = "Label";

// ─── Select ───────────────────────────────────────────────
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 cursor-pointer",
        className
      )}
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
        "flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 resize-none",
        className
      )}
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
    default: "bg-blue-50 border-blue-200 text-blue-800",
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  return (
    <div className={cn("rounded-lg border p-4", styles[variant], className)}>
      {title && <p className="font-semibold text-sm mb-1">{title}</p>}
      <p className="text-sm">{children}</p>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin text-green-600", className || "w-6 h-6")}
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
        <h1 className="text-2xl font-display font-bold text-gray-800">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
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
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-green-400" />
        </div>
      )}
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
