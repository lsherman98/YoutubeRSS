import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscribeInstructions } from "@/components/instructions/subscribe-instructions";
import { toast } from "sonner";
import { useState } from "react";
import { getPodcastShareUrl } from "@/lib/api/api";

interface PodcastButtonProps {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  platform: "apple" | "spotify" | "youtube" | "pocketcasts" | "rssFeed";
  label: string;
}

export function PodcastButton({ href, onClick, platform, label }: PodcastButtonProps) {
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

interface PodcastSubscribeButtonsProps {
  podcastUrl: string;
  podcastId: string;
}

export function PodcastSubscribeButtons({ podcastUrl, podcastId }: PodcastSubscribeButtonsProps) {
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [instructionsTab, setInstructionsTab] = useState<"apple" | "spotify" | "youtube">("apple");

  const handleSubscribe = async (platform: "apple" | "spotify" | "youtube" | "pocketcasts") => {
    const res = await getPodcastShareUrl(podcastId, platform);
    if (res.url) {
      window.open(res?.url, "_blank");
    } else {
      setInstructionsTab(platform as "apple" | "spotify" | "youtube");
      setInstructionsModalOpen(true);
    }
  };

  return (
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
      <SubscribeInstructions
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
        podcastId={podcastId}
        open={instructionsModalOpen}
        onOpenChange={setInstructionsModalOpen}
        initialTab={instructionsTab}
      />
    </div>
  );
}
