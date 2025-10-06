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
import { Plus, Youtube, Upload } from "lucide-react";
import { YoutubeUrlInput } from "@/components/youtube-url-input";
import { AudioFileInput } from "@/components/audio-file-input";
import { useState } from "react";
import type { AudioUpload } from "@/lib/api/api";

interface AddItemDialogProps {
  podcastId: string | null;
}

export function AddItemDialog({ podcastId }: AddItemDialogProps) {
  const [isOpen, setOpen] = useState(false);
  const [youtubeUrls, setYoutubeUrls] = useState<{ url: string }[]>([{ url: "" }]);
  const [audioUploads, setAudioUploads] = useState<AudioUpload[]>([]);

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
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                YouTube URLs
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Audio Files
              </TabsTrigger>
            </TabsList>
            <TabsContent value="youtube" className="mt-4 flex-1">
              <YoutubeUrlInput
                podcastId={podcastId}
                onSuccess={() => setOpen(false)}
                youtubeUrls={youtubeUrls}
                setYoutubeUrls={setYoutubeUrls}
              />
            </TabsContent>
            <TabsContent value="upload" className="mt-4 flex-1">
              <AudioFileInput
                podcastId={podcastId}
                onSuccess={() => setOpen(false)}
                audioItems={audioUploads}
                setAudioItems={setAudioUploads}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
