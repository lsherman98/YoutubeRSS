import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InstructionStepsProps {
  children: ReactNode;
  className?: string;
}

export function InstructionSteps({ children, className }: InstructionStepsProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

interface InstructionStepProps {
  number: number;
  children: ReactNode;
  className?: string;
}

export function InstructionStep({ number, children, className }: InstructionStepProps) {
  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
          {number}
        </div>
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm leading-relaxed text-foreground">{children}</p>
      </div>
    </div>
  );
}

interface InstructionTextProps {
  children: ReactNode;
  className?: string;
}

export function InstructionText({ children, className }: InstructionTextProps) {
  return <div className={cn("text-sm text-muted-foreground leading-relaxed", className)}>{children}</div>;
}

interface InstructionNoteProps {
  children: ReactNode;
  variant?: "info" | "warning" | "success";
  className?: string;
}

export function InstructionNote({ children, variant = "info", className }: InstructionNoteProps) {
  const variantStyles = {
    info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
    warning:
      "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100",
    success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
  };

  return <div className={cn("p-4 rounded-lg border text-sm", variantStyles[variant], className)}>{children}</div>;
}

interface InstructionCodeBlockProps {
  code: string;
  label?: string;
  className?: string;
}

export function InstructionCodeBlock({ code, label, className }: InstructionCodeBlockProps) {
  return (
    <div className={cn("p-4 bg-muted rounded-lg", className)}>
      {label && <p className="text-sm font-medium mb-2">{label}</p>}
      <code className="text-xs break-all bg-background p-2 rounded block font-mono">{code}</code>
    </div>
  );
}
