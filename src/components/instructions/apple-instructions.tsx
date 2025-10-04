import { useUpdatePodcast } from "@/lib/api/mutations";
import { useState } from "react";
import { toast } from "sonner";
import { InstructionStep, InstructionSteps } from "./instruction-steps";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { InstructionScreenshot } from "./instruction-screenshot";

export function AppleInstructions({ podcastUrl, podcastId }: { podcastUrl: string; podcastId: string }) {
  const updatePodcastMutation = useUpdatePodcast();
  const [appleUrl, setAppleUrl] = useState("");

  const handleSaveAppleUrl = async () => {
    if (!appleUrl.trim()) return;
    try {
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: { apple_url: appleUrl.trim() },
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

        <InstructionScreenshot src="../../public/screenshots/apple/frequency.png" />

        <InstructionStep number={5}>
          Set <strong>Content Rights</strong> to <strong>This show does not contain third-party content</strong>.
        </InstructionStep>

        <InstructionScreenshot src="../../public/screenshots/apple/content-rights.png" />

        <InstructionStep number={6}>
          In the <strong>Availability</strong> tab, go to the <strong>Distribution</strong> section and uncheck{" "}
          <strong>Make this show available for distribution</strong>. <i>(Optional)</i>
        </InstructionStep>

        <InstructionScreenshot src="../../public/screenshots/apple/distribution.png" />

        <InstructionStep number={7}>
          Scroll down to <strong>Show Claiming</strong> and check <strong>Don't allow show to be claimed</strong>.
          <i>(Optional)</i>
        </InstructionStep>

        <InstructionScreenshot src="../../public/screenshots/apple/claiming.png" />

        <InstructionStep number={8}>
          Click <strong>Save</strong> and then <strong>Publish</strong>. Your podcast is now available on Apple
          Podcasts!
        </InstructionStep>
      </InstructionSteps>
    </div>
  );
}
