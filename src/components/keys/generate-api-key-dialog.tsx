import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";

interface GenerateAPIKeyDialogProps {
  onGenerate: (title: string) => void;
  isPending: boolean;
}

export function GenerateAPIKeyDialog({ onGenerate, isPending }: GenerateAPIKeyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleGenerate = () => {
    if (title.trim()) {
      onGenerate(title);
      setTitle("");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Generate Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Key</DialogTitle>
          <DialogDescription>
            Create a new key for API or CLI access. You'll only see this key once, so
            make sure to save it securely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Key Title</Label>
            <Input
              id="title"
              placeholder="e.g., My Application Key"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setTitle("");
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!title.trim() || isPending}>
            Generate Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
