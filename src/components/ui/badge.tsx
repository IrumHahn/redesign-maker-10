import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-bold", {
  variants: {
    variant: {
      default: "bg-muted text-muted-foreground",
      dark: "bg-foreground text-background",
      green: "bg-emerald-50 text-emerald-700",
      blue: "bg-blue-50 text-blue-700"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
