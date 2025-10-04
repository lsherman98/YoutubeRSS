import { useUpdatePodcast } from "@/lib/api/mutations";
import { useState } from "react";
import { toast } from "sonner";
import { InstructionStep, InstructionSteps } from "./instruction-steps";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FeedURL } from "./feed-url";

export function YouTubeInstructions({ podcastUrl, podcastId }: { podcastUrl: string; podcastId: string }) {
  const updatePodcastMutation = useUpdatePodcast();
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const handleSaveYoutubeUrl = async () => {
    if (!youtubeUrl.trim()) return;
    try {
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: { youtube_url: youtubeUrl.trim() },
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
        <FeedURL url={podcastUrl} className="mt-6" />
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
