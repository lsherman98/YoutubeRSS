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
import { useState, useEffect } from "react";
import { Plus, LoaderCircle, MoreHorizontal, Podcast, Edit } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeletePodcastItem } from "@/lib/api/mutations";
import { getPodcastShareUrl } from "@/lib/api/api";
import { toast } from "sonner";
import { PodcastInstructionsModal } from "@/components/instructions/podcast-instructions-modal";
import { Info } from "lucide-react";
import { useUpdatePodcast } from "@/lib/api/mutations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PodcastButtonProps {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  platform: "apple" | "spotify" | "youtube" | "pocketcasts" | "rssFeed";
  label: string;
}

function PodcastButton({ href, onClick, platform, label }: PodcastButtonProps) {
  const buttonClasses = {
    apple: "w-[165px]",
    spotify: "w-[106px]",
    youtube: "w-[165px]",
    pocketcasts: "w-[150px]",
    rssFeed: "w-[121px]",
  };

  const bgPositions = {
    apple: { light: "bg-[position:-230px_7px]", dark: "dark:bg-[position:10px_7px]" },
    spotify: { light: "bg-[position:-230px_-53px]", dark: "dark:bg-[position:10px_-53px]" },
    youtube: { light: "bg-[position:-230px_-717px]", dark: "dark:bg-[position:10px_-717px]" },
    pocketcasts: { light: "bg-[position:-230px_-473px]", dark: "dark:bg-[position:10px_-473px]" },
    rssFeed: { light: "bg-[position:-230px_-653px]", dark: "dark:bg-[position:10px_-653px]" },
  };

  const widthClass = buttonClasses[platform];
  const bgLight = bgPositions[platform].light;
  const bgDark = bgPositions[platform].dark;

  return (
    <a
      href={href}
      onClick={onClick}
      className={`
        inline-block h-[40px] ${widthClass}
        bg-white dark:bg-black
        border border-black dark:border-gray-700
        rounded-md
        bg-[url('https://www.buzzsprout.com/images/badges/listen-on-embed.svg')]
        bg-no-repeat
        ${bgLight} ${bgDark}
        indent-[-9000px]
        transition-opacity hover:opacity-80
        cursor-pointer
      `}
    >
      {label}
    </a>
  );
}

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
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: podcast?.title || "",
    description: podcast?.description || "",
    website: podcast?.website || "",
    image: null as File | null,
  });
  const podcastUrl = podcast ? pb.files.getURL(podcast, podcast?.file) : "";
  const imageUrl = podcast?.image ? pb.files.getURL(podcast, podcast.image) : null;
  const deleteItemMutation = useDeletePodcastItem();
  const updatePodcastMutation = useUpdatePodcast();

  useEffect(() => {
    if (podcast) {
      setFormData({
        title: podcast.title || "",
        description: podcast.description || "",
        website: podcast.website || "",
        image: null,
      });
    }
  }, [podcast]);

  const handleUpdatePodcast = async () => {
    if (!podcast) return;

    const data: any = {
      title: formData.title,
      description: formData.description,
      website: formData.website,
    };

    if (formData.image) {
      data.image = formData.image;
    }

    try {
      await updatePodcastMutation.mutateAsync({ id: podcast.id, data });
      toast.success("Podcast updated successfully!");
      setIsUpdateDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update podcast");
    }
  };

  const handleSubscribe = async (platform: string) => {
    const res = await getPodcastShareUrl(id, platform);
    if (res.share_url) {
      window.open(res?.share_url, "_blank");
    } else if (res.connect_url) {
      window.open(res.connect_url, "_blank");
    }
  };

  return (
    <div className="w-full">
      <div className="w-full mb-6 flex justify-between items-start">
        <div className="flex-1 mr-4">
          <div className="flex items-start gap-4">
            {imageUrl ? (
              <img src={imageUrl} alt={podcast?.title} className="w-34 h-34 object-cover rounded-lg" />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <Podcast className="w-16 h-16 text-gray-500" />
              </div>
            )}
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
                    <div className="flex flex-wrap gap-2 items-center">
                      <PodcastButton
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (podcastUrl) {
                            await navigator.clipboard.writeText(podcastUrl);
                            toast.success("Copied RSS feed URL to clipboard!");
                          }
                        }}
                        platform="rssFeed"
                        label="get RSS Feed"
                      />
                      <PodcastButton
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubscribe("pocketcasts");
                        }}
                        platform="pocketcasts"
                        label="Listen on Pocket Casts"
                      />
                      <PodcastButton
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubscribe("apple");
                        }}
                        platform="apple"
                        label="Listen on Apple Podcasts"
                      />
                      <PodcastButton
                        href={"#"}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubscribe("spotify");
                        }}
                        platform="spotify"
                        label="Listen on Spotify"
                      />
                      <PodcastButton
                        href={"#"}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubscribe("youtube");
                        }}
                        platform="youtube"
                        label="Listen on YouTube"
                      />
                      <PodcastInstructionsModal
                        trigger={
                          <Button
                            variant="default"
                            size="default"
                            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                          >
                            <Info className="h-5 w-5" />
                          </Button>
                        }
                        podcastUrl={podcastUrl}
                        podcastId={id}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Podcast
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Podcast
                </DialogTitle>
                <DialogDescription>Update your podcast details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Podcast title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Podcast description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, image: file });
                    }}
                  />
                  {podcast?.image && (
                    <p className="text-sm text-gray-500 mt-1">
                      Current image will be replaced if you select a new one.
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePodcast} disabled={updatePodcastMutation.isPending}>
                    {updatePodcastMutation.isPending ? "Updating..." : "Update Podcast"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Url</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(podcastItems) &&
            podcastItems.map((item) => {
              if (!item.expand.download) {
                return (
                  <TableRow key={item.id}>
                    <TableCell colSpan={6} className="text-center">
                      <div className="flex items-center justify-center py-2 bg-gray-100 rounded">
                        <LoaderCircle className="h-6 w-6 animate-spin mr-2" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[350px] truncate" title={item.expand.download.title}>
                    {item.expand.download.title}
                  </TableCell>
                  <TableCell>{formatDuration(item.expand.download.duration)}</TableCell>
                  <TableCell>{item.expand.download.channel}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.url}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">
                      {item.url}
                    </a>
                  </TableCell>
                  <TableCell>{new Date(item.created).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem variant="destructive" onClick={() => deleteItemMutation.mutate(item.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
