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