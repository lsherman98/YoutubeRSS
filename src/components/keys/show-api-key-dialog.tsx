import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon, CopyIcon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";

interface ShowAPIKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string | null;
  keyTitle: string;
}

export function ShowAPIKeyDialog({ isOpen, onOpenChange, apiKey, keyTitle }: ShowAPIKeyDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>API Key Generated Successfully</DialogTitle>
          <DialogDescription>Your new API key has been created. Copy it now and store it securely.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
            <AlertTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Important: Save this key now</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                This is the only time you'll be able to see this API key. Make sure to copy it and store it in a secure
                location.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Key Title</label>
            <Input value={keyTitle} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="flex gap-2">
              <Input value={apiKey || ""} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopy} className="flex-shrink-0">
                {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>I've Saved My Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
