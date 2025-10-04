import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstructionScreenshotProps {
  src?: string;
  alt: string;
  description?: string;
  className?: string;
}

export function InstructionScreenshot({ src, alt, description, className }: InstructionScreenshotProps) {
  return (
    <div className={cn("my-4", className)}>
      <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
        {src ? (
          <img src={src} alt={alt} className="w-full h-auto" />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 min-h-[200px]">
            <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground text-center">Screenshot placeholder</p>
          </div>
        )}
      </div>
      {description && <p className="text-xs text-muted-foreground text-center mt-2 italic">{description}</p>}
    </div>
  );
}

interface InstructionScreenshotGridProps {
  children: React.ReactNode;
  columns?: 2 | 3;
  className?: string;
}

export function InstructionScreenshotGrid({ children, columns = 2, className }: InstructionScreenshotGridProps) {
  const gridCols = columns === 2 ? "grid-cols-2" : "grid-cols-3";

  return <div className={cn("grid gap-4", gridCols, className)}>{children}</div>;
}
