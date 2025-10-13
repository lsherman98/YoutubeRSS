import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useCreateJobs } from "@/lib/api/mutations";
import { YoutubeUrlInput, YoutubeURLsFormSchema } from "@/components/youtube-url-input";
import type z from "zod";
import { useGetUsage } from "@/lib/api/queries";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CreateJobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type YouTubeUrlItem = { url: string };

export function CreateJobDialog({ isOpen, onOpenChange }: CreateJobDialogProps) {
  const [youtubeUrls, setYoutubeUrls] = useState<YouTubeUrlItem[]>([{ url: "" }]);
  const createJobsMutation = useCreateJobs();

  const { data: usage } = useGetUsage();
  const currentUsage = usage?.usage ?? 0;
  const usageLimit = usage?.limit ?? 0;
  const usageLimitReached = currentUsage >= usageLimit;
  const tierLookupKey = usage?.expand?.tier.lookup_key;
  const jobsDisabled =
    tierLookupKey === "free" || tierLookupKey === "basic_monthly" || tierLookupKey === "basic_yearly";

  const handleSubmit = (data: z.infer<typeof YoutubeURLsFormSchema>) => {
    const urls = data.youtubeUrls.filter((item) => item.url.trim() !== "").map((item) => item.url.trim());
    if (urls.length === 0) {
      return;
    }

    createJobsMutation.mutate(urls, {
      onSuccess: () => {
        setYoutubeUrls([{ url: "" }]);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DialogTrigger asChild>
                <Button disabled={usageLimitReached || jobsDisabled}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Jobs
                </Button>
              </DialogTrigger>
            </div>
          </TooltipTrigger>
          {usageLimitReached && (
            <TooltipContent>
              <p>Usage limit reached. Upgrade your plan to create more jobs.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Jobs
          </DialogTitle>
          <DialogDescription>Enter YouTube URLs to convert to audio.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0 mt-4">
          <YoutubeUrlInput
            youtubeUrls={youtubeUrls}
            setYoutubeUrls={setYoutubeUrls}
            onSubmit={handleSubmit}
            isPending={createJobsMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
