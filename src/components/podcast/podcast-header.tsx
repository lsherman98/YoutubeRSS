import { pb } from "@/lib/pocketbase";
import { PodcastSubscribeButtons } from "./podcast-button";
import { EditPodcastDialog } from "./edit-podcast-dialog";
import { AddItemDialog } from "./add-item-dialog";
import type { PodcastsResponse } from "@/lib/pocketbase-types";

interface PodcastHeaderProps {
  podcast: PodcastsResponse;
  podcastUrl: string;
  podcastId: string;
}

export function PodcastHeader({ podcast, podcastUrl, podcastId }: PodcastHeaderProps) {
  const imageUrl = pb.files.getURL(podcast, podcast?.image);

  return (
    <div className="w-full mb-6 flex justify-between items-start">
      <div className="flex-1 mr-4">
        <div className="flex items-start gap-4">
          <img src={imageUrl} alt={podcast?.title} className="w-32 h-32 object-cover rounded-lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{podcast?.title}</h1>
            <p className="text-gray-600">{podcast?.description}</p>
            <div className="space-y-2">
              {podcast?.website && (
                <p className="text-sm">
                  <a
                    href={podcast.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {podcast.website}
                  </a>
                </p>
              )}
              {podcastUrl && (
                <div className="flex flex-col items-start gap-2">
                  <PodcastSubscribeButtons podcastUrl={podcastUrl} podcastId={podcastId} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <EditPodcastDialog podcast={podcast} />
        <AddItemDialog podcastId={podcastId} />
      </div>
    </div>
  );
}
