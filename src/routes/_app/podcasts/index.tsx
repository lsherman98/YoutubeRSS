import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetPodcasts } from "@/lib/api/queries";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePodcast, useDeletePodcast } from "@/lib/api/mutations";
import { getUserId } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Globe, ImageIcon, Type, MoreHorizontal, Trash, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { YoutubeUrlInput } from "@/components/youtube-url-input";

export const Route = createFileRoute("/_app/podcasts/")({
  component: RouteComponent,
});

const createPodcastFormSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  image: z.instanceof(File).optional(),
  website: z
    .string()
    .refine(
      (val) =>
        val === "" ||
        /^((https?:\/\/)|(www\.))[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(
          val
        ),
      "Invalid URL format"
    )
    .optional(),
});

function RouteComponent() {
  const { data: podcasts } = useGetPodcasts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null);
  const createPodcastMutation = useCreatePodcast();
  const deletePodcastMutation = useDeletePodcast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof createPodcastFormSchema>>({
    resolver: zodResolver(createPodcastFormSchema),
    defaultValues: {
      title: "",
      description: "",
      image: undefined,
      website: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createPodcastFormSchema>) => {
    createPodcastMutation.mutate(
      {
        title: values.title,
        description: values.description,
        user: getUserId() || "",
        image: values.image ? new File([values.image], values.image.name) : undefined,
        website: values.website,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          form.reset();
        },
      }
    );
  };

  return (
    <div className="w-full">
      <div className="w-full flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Podcast</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create New Podcast
              </DialogTitle>
              <DialogDescription>Fill in the details below to create your podcast.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter podcast title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter podcast description" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="www.yourpodcast.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Podcast Cover
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            field.onChange(e.target.files?.[0]);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createPodcastMutation.isPending}>
                  {createPodcastMutation.isPending ? "Creating..." : "Create Podcast"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {podcasts?.map((podcast) => (
            <TableRow
              key={podcast.id}
              onClick={() => navigate({ to: "/podcasts/$id", params: { id: podcast.id } })}
              className="cursor-pointer hover:bg-muted"
            >
              <TableCell>{podcast.title}</TableCell>
              <TableCell>{podcast.description}</TableCell>
              <TableCell>{podcast.website}</TableCell>
              <TableCell>{new Date(podcast.created).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedPodcastId(podcast.id);
                        setIsAddItemDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deletePodcastMutation.mutate(podcast.id)}
                      className="text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add YouTube URLs
            </DialogTitle>
            <DialogDescription>Add one or more YouTube video URLs to this podcast.</DialogDescription>
          </DialogHeader>
          {selectedPodcastId && <YoutubeUrlInput podcastId={selectedPodcastId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
