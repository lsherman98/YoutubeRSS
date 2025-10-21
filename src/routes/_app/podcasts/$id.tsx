import { useGetPodcast, useGetPodcastItems } from "@/lib/api/queries";
import { createFileRoute } from "@tanstack/react-router";
import { pb } from "@/lib/pocketbase";
import { PodcastHeader } from "@/components/podcast/podcast-header";
import { PodcastItemsTable } from "@/components/podcast/podcast-items-table";

export const Route = createFileRoute("/_app/podcasts/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const id = Route.useParams().id;
  const { data: podcastItems } = useGetPodcastItems(id);
  const { data: podcast } = useGetPodcast(id);

  const podcastUrl = podcast ? pb.files.getURL(podcast, podcast?.file) : "";

  return (
    <div className="w-full px-2 sm:px-4 md:px-0">
      {podcast && (
        <PodcastHeader
          podcast={podcast}
          podcastUrl={podcastUrl}
          podcastId={id}
          disabled={!podcastItems || podcastItems.length === 0}
        />
      )}
      <PodcastItemsTable podcastItems={podcastItems || []} />
    </div>
  );
}
