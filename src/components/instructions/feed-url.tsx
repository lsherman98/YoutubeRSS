import { toast } from "sonner";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export function FeedURL({ url, className }: { url: string; className?: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("RSS feed URL copied to clipboard.");
  };

  return (
    <div className={cn("p-4 bg-muted rounded-lg", className)}>
      <p className="text-sm font-medium mb-2">Your RSS Feed URL:</p>
      <div className="flex gap-2">
        <code className="text-xs break-all bg-background p-2 rounded flex-1">{url}</code>
        <Button onClick={handleCopy}>Copy</Button>
      </div>
    </div>
  );
}
