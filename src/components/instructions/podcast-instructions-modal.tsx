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
import { InstructionStep, InstructionSteps } from "./instruction-steps";
import { InstructionScreenshot } from "./instruction-screenshot";
import { useUpdatePodcast } from "@/lib/api/mutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface PodcastInstructionsModalProps {
  trigger: ReactNode;
  podcastUrl: string;
  podcastId: string;
}

export function PodcastInstructionsModal({ trigger, podcastUrl, podcastId }: PodcastInstructionsModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="min-w-[60vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Help Guide</DialogTitle>
          <DialogDescription>
            Follow the instructions below to add this podcast to your preferred platform.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="apple" className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="apple">Apple Podcasts</TabsTrigger>
            <TabsTrigger value="spotify">Spotify</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-6">
            <TabsContent value="apple" className="mt-0">
              <ApplePodcastsInstructions podcastUrl={podcastUrl} podcastId={podcastId} />
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

function ApplePodcastsInstructions({ podcastUrl, podcastId }: { podcastUrl: string; podcastId: string }) {
  const updatePodcastMutation = useUpdatePodcast();
  const [appleUrl, setAppleUrl] = useState("");

  const handleSaveAppleUrl = async () => {
    if (!appleUrl.trim()) return;
    try {
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: { apple_share_url: appleUrl.trim() },
      });
      toast.success("Apple Podcasts URL saved!");
      setAppleUrl("");
    } catch (error) {
      toast.error("Failed to save Apple Podcasts URL");
    }
  };

  return (
    <div className="space-y-4">
      <InstructionSteps>
        <InstructionStep number={1}>
          Make sure you are logged in to your{" "}
          <strong>
            <a
              href="https://podcastsconnect.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              Apple Podcasts Account
            </a>
          </strong>
          . Then, click{" "}
          <strong>
            <a
              href={`https://podcastsconnect.apple.com/my-podcasts/new-feed?submitfeed=${podcastUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              here
            </a>{" "}
          </strong>
          to add the RSS feed.
        </InstructionStep>

        <InstructionStep number={2}>
          Wait for your podcast details to be processed. This may take a few minutes.
        </InstructionStep>

        <InstructionStep number={3}>
          Copy the provided <strong>Apple Podcasts URL</strong> and save it below: <strong>(Important)</strong>
        </InstructionStep>
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Apple Podcasts URL:</p>
          <div className="flex gap-2">
            <Input
              placeholder="Paste your Apple Podcasts URL here..."
              value={appleUrl}
              onChange={(e) => setAppleUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveAppleUrl} disabled={!appleUrl.trim() || updatePodcastMutation.isPending}>
              {updatePodcastMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <InstructionStep number={4}>
          Set <strong>Update Frequency</strong> to <strong>No Set Schedule</strong>.
        </InstructionStep>

        <InstructionScreenshot src="../../public/screenshots/apple/frequency.png" alt="Set Frequency" />

        <InstructionStep number={5}>
          Set <strong>Content Rights</strong> to <strong>This show does not contain third-party content</strong>.
        </InstructionStep>

        <InstructionScreenshot src="../../public/screenshots/apple/content-rights.png" alt="Set Content Rights" />

        <InstructionStep number={6}>
          In the <strong>Availability</strong> tab, go to the <strong>Distribution</strong> section and uncheck{" "}
          <strong>Make this show available for distribution</strong>. <i>(Optional)</i>
        </InstructionStep>

        <InstructionScreenshot src="../../public/screenshots/apple/distribution.png" alt="Set Distribution" />

        <InstructionStep number={7}>
          Scroll down to <strong>Show Claiming</strong> and check <strong>Don't allow show to be claimed</strong>.
          <i>(Optional)</i>
        </InstructionStep>

        <InstructionScreenshot src="../../public/screenshots/apple/claiming.png" alt="Set Show Claiming" />

        <InstructionStep number={8}>
          Click <strong>Save</strong> and then <strong>Publish</strong>. Your podcast is now available on Apple
          Podcasts!
        </InstructionStep>
      </InstructionSteps>
    </div>
  );
}

function SpotifyInstructions({ podcastUrl, podcastId }: { podcastUrl: string; podcastId: string }) {
  const updatePodcastMutation = useUpdatePodcast();
  const [spotifyUrl, setSpotifyUrl] = useState("");

  const handleSaveSpotifyUrl = async () => {
    if (!spotifyUrl.trim()) return;
    try {
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: { spotify_share_url: spotifyUrl.trim() },
      });
      toast.success("Spotify URL saved!");
      setSpotifyUrl("");
    } catch (error) {
      toast.error("Failed to save Spotify URL");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(podcastUrl);
    toast.success("RSS feed URL copied to clipboard.");
  };

  return (
    <div className="space-y-4">
      <InstructionSteps>
        <InstructionStep number={1}>
          Submit your podcast RSS feed to Spotify by visiting{" "}
          <strong>
            <a
              href="https://creators.spotify.com/dash/submit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              creators.spotify.com/dash/submit
            </a>
          </strong>
          . Log in if needed.
        </InstructionStep>
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Your RSS Feed URL:</p>
          <div className="flex gap-2">
            <code className="text-xs break-all bg-background p-2 rounded flex-1">{podcastUrl}</code>
            <Button onClick={handleCopy}>Copy</Button>
          </div>
        </div>

        <InstructionScreenshot alt="Spotify Submit RSS" src="../../public/screenshots/spotify/submit.png" />

        <InstructionStep number={2}>Follow the instructions to verify ownership of the podcast.</InstructionStep>

        <InstructionStep number={3}>Once finished, save the Spotify podcast link below:</InstructionStep>
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium mb-2 text-green-900 dark:text-green-100">Spotify Link:</p>
          <div className="flex gap-2">
            <Input
              placeholder="Paste your Spotify URL here..."
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveSpotifyUrl} disabled={!spotifyUrl.trim() || updatePodcastMutation.isPending}>
              {updatePodcastMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </InstructionSteps>
    </div>
  );
}

function YouTubeInstructions({ podcastUrl, podcastId }: { podcastUrl: string; podcastId: string }) {
  const updatePodcastMutation = useUpdatePodcast();
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const handleSaveYoutubeUrl = async () => {
    if (!youtubeUrl.trim()) return;
    try {
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: { youtube_share_url: youtubeUrl.trim() },
      });
      toast.success("YouTube URL saved!");
      setYoutubeUrl("");
    } catch (error) {
      toast.error("Failed to save YouTube URL");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(podcastUrl);
    toast.success("RSS feed URL copied to clipboard.");
  };

  return (
    <div className="space-y-4">
      <InstructionSteps>
        <InstructionStep number={1}>
          Navigate to{" "}
          <strong>
            <a
              href="https://music.youtube.com/library/podcasts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Youtube Music
            </a>
          </strong>
          . Log in if needed.
        </InstructionStep>

        <InstructionStep number={2}>
          Select <strong>Add podcast</strong> then click <strong>Add RSS feed</strong>. Paste in your RSS feed URL.
        </InstructionStep>
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Your RSS Feed URL:</p>
          <div className="flex gap-2">
            <code className="text-xs break-all bg-background p-2 rounded flex-1">{podcastUrl}</code>
            <Button onClick={handleCopy}>Copy</Button>
          </div>
        </div>
      </InstructionSteps>

      <InstructionStep number={3}>Once finished, save the Youtube Music link below:</InstructionStep>

      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-sm font-medium mb-2 text-red-900 dark:text-red-100">YouTube Link:</p>
        <div className="flex gap-2">
          <Input
            placeholder="Paste your YouTube URL here..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSaveYoutubeUrl} disabled={!youtubeUrl.trim() || updatePodcastMutation.isPending}>
            {updatePodcastMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
