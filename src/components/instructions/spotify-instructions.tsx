import { useUpdatePodcast } from "@/lib/api/mutations";
import { useState } from "react";
import { toast } from "sonner";
import { InstructionStep, InstructionSteps } from "./instruction-steps";
import { InstructionScreenshot } from "./instruction-screenshot";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FeedURL } from "./feed-url";

export function SpotifyInstructions({ podcastUrl, podcastId }: { podcastUrl: string; podcastId: string }) {
  const updatePodcastMutation = useUpdatePodcast();
  const [spotifyUrl, setSpotifyUrl] = useState("");

  const handleSaveSpotifyUrl = async () => {
    if (!spotifyUrl.trim()) return;
    try {
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: { spotify_url: spotifyUrl.trim() },
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
        <FeedURL url={podcastUrl} className="mt-6" />
        <InstructionScreenshot src="/static/submit.png" />
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
