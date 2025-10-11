import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Youtube, Upload, AlertCircle } from "lucide-react";
import { YoutubeUrlInput, YoutubeURLsFormSchema } from "@/components/youtube-url-input";
import { AudioFileInput } from "@/components/podcast/audio-file-input";
import { useState } from "react";
import type { AudioUpload } from "@/lib/api/api";
import type z from "zod";
import { useAddYoutubeUrls } from "@/lib/api/mutations";
import { useGetUsage } from "@/lib/api/queries";
import { Link } from "@tanstack/react-router";

interface AddItemDialogProps {
  podcastId: string | null;
}

export function AddItemDialog({ podcastId }: AddItemDialogProps) {
  const [isOpen, setOpen] = useState(false);
  const [youtubeUrls, setYoutubeUrls] = useState<{ url: string }[]>([{ url: "" }]);
  const [audioUploads, setAudioUploads] = useState<AudioUpload[]>([]);

  const { data: usage } = useGetUsage();
  const freeTier = usage?.expand?.tier.lookup_key === "free";
  const currentUsage = usage?.usage ?? 0;
  const usageLimit = usage?.limit ?? 0;
  const usageLimitReached = currentUsage >= usageLimit;

  const currentUploads = usage?.uploads ?? 0;
  const uploadsLimit = 15;
  const uploadLimitReached = freeTier && currentUploads >= uploadsLimit;

  const addYoutubeUrlsMutation = useAddYoutubeUrls();

  function onYoutubeURLSubmit(data: z.infer<typeof YoutubeURLsFormSchema>) {
    const urls = data.youtubeUrls.filter((item) => item.url.trim() !== "").map((item) => item.url.trim());

    if (!podcastId) return;

    addYoutubeUrlsMutation.mutate(
      { urls, podcastId },
      {
        onSuccess: () => {
          setYoutubeUrls([{ url: "" }]);
          setOpen(false);
        },
      }
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Content to Podcast
          </DialogTitle>
          <DialogDescription>Add YouTube videos or upload audio files to this podcast.</DialogDescription>
        </DialogHeader>

        {podcastId && (
          <Tabs defaultValue="youtube" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="youtube" className="flex items-center gap-2" disabled={usageLimitReached}>
                <Youtube className="h-4 w-4" />
                YouTube URLs
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2" disabled={uploadLimitReached}>
                <Upload className="h-4 w-4" />
                Audio Files
              </TabsTrigger>
            </TabsList>
            <TabsContent value="youtube" className="mt-4 flex-1">
              {usageLimitReached ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
                  <AlertCircle className="h-12 w-12 text-amber-500" />
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">Usage Limit Reached</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      You've reached your monthly usage limit. Upgrade your plan to add more YouTube URLs to your
                      podcasts.
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/" className="flex items-center gap-2">
                      Upgrade Plan
                    </Link>
                  </Button>
                </div>
              ) : (
                <YoutubeUrlInput
                  youtubeUrls={youtubeUrls}
                  setYoutubeUrls={setYoutubeUrls}
                  onSubmit={onYoutubeURLSubmit}
                  isPending={addYoutubeUrlsMutation.isPending}
                />
              )}
            </TabsContent>
            <TabsContent value="upload" className="mt-4 flex-1">
              {uploadLimitReached ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
                  <AlertCircle className="h-12 w-12 text-amber-500" />
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">Upload Limit Reached</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      You've reached your audio file upload limit on the free plan. Upgrade to continue uploading audio
                      files.
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/" className="flex items-center gap-2">
                      Upgrade Plan
                    </Link>
                  </Button>
                </div>
              ) : (
                <AudioFileInput
                  podcastId={podcastId}
                  onSuccess={() => setOpen(false)}
                  audioItems={audioUploads}
                  setAudioItems={setAudioUploads}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
