import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-solana-purple focus:ring-offset-2 focus:ring-offset-[#080B12]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-solana-purple/20 text-solana-purple",
        secondary: "border-border-subtle bg-surface text-muted-foreground",
        outline: "border-border-subtle text-foreground",
        success: "border-transparent bg-solana-green/15 text-solana-green",
        destructive: "border-transparent bg-red-500/15 text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
