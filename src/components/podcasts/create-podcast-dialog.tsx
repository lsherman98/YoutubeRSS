import { Button } from "@/components/ui/button";
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
import { useCreatePodcast } from "@/lib/api/mutations";
import { getUserId, getUserName } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Globe, ImageIcon, Type } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

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

interface CreatePodcastDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
}

export function CreatePodcastDialog({ isOpen, onOpenChange, disabled }: CreatePodcastDialogProps) {
  const createPodcastMutation = useCreatePodcast();

  const form = useForm<z.infer<typeof createPodcastFormSchema>>({
    resolver: zodResolver(createPodcastFormSchema),
    defaultValues: {
      title: getUserName() ? `${getUserName()}'s Podcast` : "My Podcast",
      description: "Private podcast feed powered by ytrss.xyz",
      image: undefined,
      website: "www.ytrss.xyz",
    },
  });

  const onSubmit = (values: z.infer<typeof createPodcastFormSchema>) => {
    createPodcastMutation.mutate(
      {
        title: values.title || "",
        description: values.description || "",
        user: getUserId() || "",
        image: values.image ? new File([values.image], values.image.name) : undefined,
        website: values.website || "",
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Add Podcast</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[425px] sm:w-full">
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
                    Cover Image
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
  );
}
