import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetPodcast, useGetPodcastItems } from "@/lib/api/queries";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { YoutubeUrlInput } from "@/components/youtube-url-input";
import { useState } from "react";
import { Plus, Copy } from "lucide-react";
import { pb } from "@/lib/pocketbase";

export const Route = createFileRoute("/_app/podcasts/$id")({
  component: RouteComponent,
});

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function RouteComponent() {
  const id = Route.useParams().id;
  const { data: podcastItems } = useGetPodcastItems(id);
  const { data: podcast } = useGetPodcast(id);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const podcastUrl = podcast ? pb.files.getURL(podcast, podcast?.file) : "";

  const copyToClipboard = async () => {
    if (podcastUrl) {
      await navigator.clipboard.writeText(podcastUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full mb-6 flex justify-between items-start">
        <div className="flex-1 mr-4">
          <h1 className="text-2xl font-bold mb-2">{podcast?.title}</h1>
          <p className="text-gray-600 mb-4">{podcast?.description}</p>
          <div className="space-y-2">
            {podcast?.website && (
              <p className="text-sm">
                <span className="font-medium">Website:</span>{" "}
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Podcast URL:</span>
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            )}
          </div>
        </div>
        <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add YouTube URLs
              </DialogTitle>
              <DialogDescription>Add one or more YouTube video URLs to this podcast.</DialogDescription>
            </DialogHeader>
            <YoutubeUrlInput podcastId={id} />
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Url</TableHead>
            <TableHead>Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {podcastItems?.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="max-w-[300px]">
                <div className="truncate" title={item.expand.download.title}>
                  {item.expand.download.title}
                </div>
              </TableCell>
              <TableCell>{formatDuration(item.expand.download.duration)}</TableCell>
              <TableCell>{item.expand.download.channel}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={item.url}>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {item.url}
                </a>
              </TableCell>
              <TableCell>{new Date(item.created).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
