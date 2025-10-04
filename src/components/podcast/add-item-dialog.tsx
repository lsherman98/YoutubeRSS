import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { YoutubeUrlInput } from "@/components/youtube-url-input";
import { useState } from "react";

interface AddItemDialogProps {
  podcastId: string | null;
}

export function AddItemDialog({ podcastId }: AddItemDialogProps) {
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);

  return (
    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add YouTube URLs
          </DialogTitle>
          <DialogDescription>Add one or more YouTube video URLs to this podcast.</DialogDescription>
        </DialogHeader>
        {podcastId && <YoutubeUrlInput podcastId={podcastId} />}
      </DialogContent>
    </Dialog>
  );
}
