import { useGetPodcasts } from "@/lib/api/queries";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreatePodcastDialog } from "@/components/podcasts/create-podcast-dialog";
import { PodcastsTable } from "@/components/podcasts/podcasts-table";

export const Route = createFileRoute("/_app/podcasts/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: podcasts } = useGetPodcasts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="w-full flex justify-end mb-6">
        <CreatePodcastDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>
      <PodcastsTable podcasts={podcasts || []} />
    </div>
  );
}
