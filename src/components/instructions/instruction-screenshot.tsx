import { cn } from "@/lib/utils";

interface InstructionScreenshotProps {
  src: string;
  description?: string;
  className?: string;
}

export function InstructionScreenshot({ src, description, className }: InstructionScreenshotProps) {
  return (
    <div className={cn("my-4", className)}>
      <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
        <img src={src} className="w-full h-auto" />
      </div>
      {description && <p className="text-xs text-muted-foreground text-center mt-2 italic">{description}</p>}
    </div>
  );
}
