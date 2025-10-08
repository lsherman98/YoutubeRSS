import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash } from "lucide-react";

const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/;

export const YoutubeURLsFormSchema = z.object({
  youtubeUrls: z
    .array(
      z.object({
        url: z.string().refine((val) => val.trim() === "" || youtubeUrlRegex.test(val), {
          message: "Please enter a valid YouTube video URL.",
        }),
      })
    )
    .min(1, { message: "At least one URL is required." })
    .max(50, { message: "Maximum 50 URLs allowed." }),
});

type YouTubeUrlItem = { url: string };

interface YoutubeUrlInputProps {
  youtubeUrls: YouTubeUrlItem[];
  setYoutubeUrls: (urls: YouTubeUrlItem[]) => void;
  onSubmit: (data: z.infer<typeof YoutubeURLsFormSchema>) => void;
  isPending: boolean;
}

export function YoutubeUrlInput({ youtubeUrls, setYoutubeUrls, onSubmit, isPending }: YoutubeUrlInputProps) {
  const form = useForm<z.infer<typeof YoutubeURLsFormSchema>>({
    resolver: zodResolver(YoutubeURLsFormSchema),
    values: {
      youtubeUrls: youtubeUrls,
    },
  });

  function isValidYoutubeUrl(url: string) {
    return youtubeUrlRegex.test(url);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const newValue = e.target.value;
    const newUrls = [...youtubeUrls];
    newUrls[index] = { url: newValue };

    if (index === youtubeUrls.length - 1 && isValidYoutubeUrl(newValue) && youtubeUrls.length < 50) {
      newUrls.push({ url: "" });
    }

    setYoutubeUrls(newUrls);
    form.setValue(`youtubeUrls.${index}.url`, newValue, { shouldValidate: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2 flex-1 overflow-y-auto max-h-96">
          {youtubeUrls.map((_, index) => (
            <FormField
              key={index}
              control={form.control}
              name={`youtubeUrls.${index}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube URL {youtubeUrls.length > 1 ? index + 1 : ""}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} onChange={(e) => handleInputChange(e, index)} className="flex-1" />
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newUrls = youtubeUrls.filter((_, i) => i !== index);
                            setYoutubeUrls(newUrls);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setYoutubeUrls([...youtubeUrls, { url: "" }])}
            disabled={youtubeUrls.length >= 50}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding..." : "Add URLs"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
