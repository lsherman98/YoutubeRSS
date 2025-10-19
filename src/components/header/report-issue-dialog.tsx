import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCreateIssue } from "@/lib/api/mutations";
import { Bug } from "lucide-react";
import { toast } from "sonner";

export function ReportIssueDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const createIssue = useCreateIssue();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    try {
      await createIssue.mutateAsync({ content, screenshots: screenshots.length > 0 ? screenshots : undefined });
      toast.success("Issue reported successfully");
      setContent("");
      setScreenshots([]);
      setOpen(false);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setScreenshots(Array.from(files));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Describe the issue you're experiencing. You can also attach screenshots to help us understand better.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="content">Issue Description *</Label>
            <Textarea
              id="content"
              placeholder="Please describe the issue you're experiencing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="screenshots">Screenshots (optional)</Label>
            <Input id="screenshots" type="file" accept="image/*" multiple onChange={handleFileChange} />
            {screenshots.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {screenshots.length} file{screenshots.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setContent("");
              setScreenshots([]);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={createIssue.isPending}>
            {createIssue.isPending ? "Submitting..." : "Submit Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
