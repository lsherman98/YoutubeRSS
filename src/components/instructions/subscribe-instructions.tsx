import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";
import { AppleInstructions } from "./apple-instructions";
import { SpotifyInstructions } from "./spotify-instructions";
import { YouTubeInstructions } from "./youtube-instructions";

interface SubscribeInstructionsProps {
  trigger?: ReactNode;
  podcastUrl: string;
  podcastId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialTab?: "apple" | "spotify" | "youtube";
}

export function SubscribeInstructions({
  trigger,
  podcastUrl,
  podcastId,
  open,
  onOpenChange,
  initialTab = "apple",
}: SubscribeInstructionsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="min-w-[60vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Help Guide</DialogTitle>
          <DialogDescription>
            Follow the instructions below to add this podcast to your preferred platform.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="apple">Apple</TabsTrigger>
            <TabsTrigger value="spotify">Spotify</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-6">
            <TabsContent value="apple" className="mt-0">
              <AppleInstructions podcastUrl={podcastUrl} podcastId={podcastId} />
            </TabsContent>

            <TabsContent value="spotify" className="mt-0">
              <SpotifyInstructions podcastUrl={podcastUrl} podcastId={podcastId} />
            </TabsContent>

            <TabsContent value="youtube" className="mt-0">
              <YouTubeInstructions podcastUrl={podcastUrl} podcastId={podcastId} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
