import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" };
export function Button({ className, variant = "secondary", ...props }: Props) {
  const styles = { primary: "bg-primary text-primary-foreground hover:bg-primary/90", secondary: "border border-border bg-card text-foreground hover:bg-muted", danger: "bg-critical text-critical-foreground hover:bg-critical/90", ghost: "text-muted-foreground hover:bg-muted hover:text-foreground" };
  return <button className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", styles[variant], className)} {...props} />;
}