import { pb } from "@/lib/pocketbase";
import { PodcastSubscribeButtons } from "./podcast-button";
import { EditPodcastDialog } from "./edit-podcast-dialog";
import { AddItemDialog } from "./add-item-dialog";
import type { PodcastsResponse } from "@/lib/pocketbase-types";

interface PodcastHeaderProps {
  podcast: PodcastsResponse;
  podcastUrl: string;
  podcastId: string;
  disabled?: boolean;
}

export function PodcastHeader({ podcast, podcastUrl, podcastId, disabled = false }: PodcastHeaderProps) {
  const imageUrl = pb.files.getURL(podcast, podcast?.image);

  return (
    <div className="w-full mb-4 md:mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <img
            src={imageUrl}
            alt={podcast?.title}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">{podcast?.title}</h1>
            <p className="text-sm sm:text-base text-gray-600 line-clamp-3 sm:line-clamp-none">{podcast?.description}</p>
            <div className="space-y-2 mt-2">
              {podcast?.website && (
                <p className="text-xs sm:text-sm">
                  <a
                    href={podcast.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate block"
                  >
                    {podcast.website}
                  </a>
                </p>
              )}
              {podcastUrl && (
                <div className="flex flex-col items-start gap-2">
                  <PodcastSubscribeButtons podcastUrl={podcastUrl} podcastId={podcastId} disabled={disabled} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 self-start md:self-auto">
        <EditPodcastDialog podcast={podcast} />
        <AddItemDialog podcastId={podcastId} />
      </div>
    </div>
  );
}
