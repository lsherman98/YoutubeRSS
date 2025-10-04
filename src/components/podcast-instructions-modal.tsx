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
      <DialogContent className="min-w-[50vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Podcast to Your Platform</DialogTitle>
          <DialogDescription>
            Follow the instructions below to add this podcast to your preferred platform.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="apple" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="apple">Apple Podcasts</TabsTrigger>
            <TabsTrigger value="spotify">Spotify</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="pocketcasts">Pocket Casts</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="apple" className="mt-6">
            <ApplePodcastsInstructions podcastUrl={podcastUrl} podcastId={podcastId} />
          </TabsContent>

          <TabsContent value="spotify" className="mt-6">
            <SpotifyInstructions podcastUrl={podcastUrl} podcastId={podcastId} />
          </TabsContent>

          <TabsContent value="youtube" className="mt-6">
            <YouTubeInstructions podcastUrl={podcastUrl} podcastId={podcastId} />
          </TabsContent>

          <TabsContent value="pocketcasts" className="mt-6">
            <PocketCastsInstructions podcastUrl={podcastUrl} />
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <ManualInstructions podcastUrl={podcastUrl} />
          </TabsContent>
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
          Open the <strong>Apple Podcasts</strong> app on your iPhone, iPad, or Mac.
        </InstructionStep>

        <InstructionScreenshot alt="Apple Podcasts app icon" description="Locate the Apple Podcasts app" />

        <InstructionStep number={2}>
          Go to the <strong>Library</strong> tab at the bottom of the screen.
        </InstructionStep>

        <InstructionScreenshot alt="Apple Podcasts Library tab" description="Navigate to Library" />

        <InstructionStep number={3}>
          Tap <strong>Follow a Show</strong> or the <strong>+</strong> button in the top right.
        </InstructionStep>

        <InstructionStep number={4}>
          Select <strong>Add a Show by URL</strong> and paste your RSS feed URL.
        </InstructionStep>

        <InstructionScreenshot alt="Add show by URL screen" description="Paste RSS feed URL" />

        <InstructionStep number={5}>
          Tap <strong>Follow</strong> to subscribe to the podcast.
        </InstructionStep>

        <InstructionStep number={6}>
          Once published, copy the Apple Podcasts link and paste it below to save it to your podcast record.
        </InstructionStep>
      </InstructionSteps>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Your RSS Feed URL:</p>
        <code className="text-xs break-all bg-background p-2 rounded block">{podcastUrl}</code>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Apple Podcasts Link:</p>
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

  return (
    <div className="space-y-4">
      <InstructionSteps>
        <InstructionStep number={1}>
          Open the <strong>Spotify</strong> app on your mobile device.
        </InstructionStep>

        <InstructionScreenshot alt="Spotify app" description="Open Spotify" />

        <InstructionStep number={2}>
          Go to <strong>Your Library</strong> and select <strong>Podcasts</strong>.
        </InstructionStep>

        <InstructionStep number={3}>
          Tap the <strong>search icon</strong> and look for "Add a podcast by URL" or similar option.
        </InstructionStep>

        <InstructionScreenshot alt="Spotify search" description="Search for podcasts" />

        <InstructionStep number={4}>
          Paste your RSS feed URL and tap <strong>Follow</strong>.
        </InstructionStep>

        <InstructionStep number={5}>The podcast will now appear in your library.</InstructionStep>

        <InstructionStep number={6}>
          Once published, copy the Spotify link and paste it below to save it to your podcast record.
        </InstructionStep>
      </InstructionSteps>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Your RSS Feed URL:</p>
        <code className="text-xs break-all bg-background p-2 rounded block">{podcastUrl}</code>
      </div>

      <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
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

  return (
    <div className="space-y-4">
      <InstructionSteps>
        <InstructionStep number={1}>
          YouTube does not support adding podcasts via RSS feed directly in their mobile app.
        </InstructionStep>

        <InstructionStep number={2}>
          However, you can use <strong>YouTube Music</strong> on desktop to import RSS feeds.
        </InstructionStep>

        <InstructionScreenshot alt="YouTube Music website" description="Visit YouTube Music" />

        <InstructionStep number={3}>
          Go to <strong>music.youtube.com</strong> and sign in.
        </InstructionStep>

        <InstructionStep number={4}>
          Look for podcast import options in settings or use a third-party service to convert the RSS feed.
        </InstructionStep>

        <InstructionStep number={5}>
          Alternatively, subscribe to the original YouTube channel if available.
        </InstructionStep>

        <InstructionStep number={6}>
          Once published, copy the YouTube link and paste it below to save it to your podcast record.
        </InstructionStep>
      </InstructionSteps>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Your RSS Feed URL:</p>
        <code className="text-xs break-all bg-background p-2 rounded block">{podcastUrl}</code>
      </div>

      <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
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

function PocketCastsInstructions({ podcastUrl }: { podcastUrl: string }) {
  return (
    <div className="space-y-4">
      <InstructionSteps>
        <InstructionStep number={1}>
          Open the <strong>Pocket Casts</strong> app on your device.
        </InstructionStep>

        <InstructionScreenshot alt="Pocket Casts app" description="Open Pocket Casts" />

        <InstructionStep number={2}>
          Tap the <strong>Discover</strong> tab at the bottom.
        </InstructionStep>

        <InstructionStep number={3}>
          Tap the <strong>search icon</strong> in the top right.
        </InstructionStep>

        <InstructionScreenshot alt="Pocket Casts search" description="Tap search icon" />

        <InstructionStep number={4}>Paste your RSS feed URL into the search bar.</InstructionStep>

        <InstructionStep number={5}>
          Tap <strong>Subscribe</strong> when the podcast appears.
        </InstructionStep>
      </InstructionSteps>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Your RSS Feed URL:</p>
        <code className="text-xs break-all bg-background p-2 rounded block">{podcastUrl}</code>
      </div>
    </div>
  );
}

function ManualInstructions({ podcastUrl }: { podcastUrl: string }) {
  return (
    <div className="space-y-4">
      <InstructionSteps>
        <InstructionStep number={1}>Copy your RSS feed URL from below.</InstructionStep>

        <InstructionStep number={2}>Open your preferred podcast app.</InstructionStep>

        <InstructionScreenshot alt="Generic podcast app" description="Open your podcast app" />

        <InstructionStep number={3}>
          Look for an option like "Add Podcast," "Subscribe by URL," or "Add RSS Feed." This is typically found in:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Settings menu</li>
            <li>Add/Plus button</li>
            <li>Search functionality</li>
            <li>Library or subscriptions section</li>
          </ul>
        </InstructionStep>

        <InstructionStep number={4}>Paste the RSS feed URL into the input field.</InstructionStep>

        <InstructionScreenshot alt="RSS feed URL input" description="Paste your RSS feed URL" />

        <InstructionStep number={5}>Confirm or subscribe to add the podcast to your library.</InstructionStep>
      </InstructionSteps>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Your RSS Feed URL:</p>
        <code className="text-xs break-all bg-background p-2 rounded block">{podcastUrl}</code>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Most modern podcast apps support adding podcasts via RSS feed URL. If you're having
          trouble, check your app's documentation or help section.
        </p>
      </div>
    </div>
  );
}
