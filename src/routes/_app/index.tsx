import { Button } from "@/components/ui/button";
import { YoutubeUrlInput } from "@/components/youtube-url-input";
import { useCreatePodcast } from "@/lib/api/mutations";
import { useGetPodcasts } from "@/lib/api/queries";
import { getUserId } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: podcasts } = useGetPodcasts();
  const createPodcastMutation = useCreatePodcast();
  const podcast = podcasts?.[0];

  const handleAddPodcast = () => {
    createPodcastMutation.mutate({
      title: "New Podcast",
      description: "This is a new podcast.",
      user: getUserId() || "",
    });
  };

  if (!podcast) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Button onClick={handleAddPodcast}>Create Podcast</Button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <YoutubeUrlInput podcastId={podcast.id} />
    </div>
  );
}
