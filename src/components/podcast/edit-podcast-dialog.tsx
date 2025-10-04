import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdatePodcast } from "@/lib/api/mutations";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import type { PodcastsResponse } from "@/lib/pocketbase-types";

interface EditPodcastDialogProps {
  podcast: PodcastsResponse;
}

export function EditPodcastDialog({ podcast }: EditPodcastDialogProps) {
  const [formData, setFormData] = useState({
    title: podcast?.title || "",
    description: podcast?.description || "",
    website: podcast?.website || "",
    image: null as File | null,
  });
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const updatePodcastMutation = useUpdatePodcast();

  useEffect(() => {
    if (podcast) {
      setFormData({
        title: podcast.title || "",
        description: podcast.description || "",
        website: podcast.website || "",
        image: null,
      });
    }
  }, [podcast]);

  const handleUpdatePodcast = async () => {
    if (!podcast) return;

    const data: any = {
      title: formData.title,
      description: formData.description,
      website: formData.website,
    };

    if (formData.image) {
      data.image = formData.image;
    }

    try {
      await updatePodcastMutation.mutateAsync({ id: podcast.id, data });
      toast.success("Podcast updated successfully!");
      setIsUpdateDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update podcast");
    }
  };

  return (
    <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Podcast
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Podcast
          </DialogTitle>
          <DialogDescription>Update your podcast details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Podcast title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Podcast description"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setFormData({ ...formData, image: file });
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePodcast} disabled={updatePodcastMutation.isPending}>
              {updatePodcastMutation.isPending ? "Updating..." : "Update Podcast"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
