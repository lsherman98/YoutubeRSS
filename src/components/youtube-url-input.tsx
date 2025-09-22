import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash } from "lucide-react";
import { useAddYoutubeUrls } from "@/lib/api/mutations";

const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/;

const FormSchema = z.object({
  youtubeUrls: z
    .array(
      z.object({
        url: z.string().refine((val) => val.trim() === "" || youtubeUrlRegex.test(val), {
          message: "Please enter a valid YouTube video URL.",
        }),
      })
    )
    .min(1, { message: "At least one URL is required." }),
});

export function YoutubeUrlInput({ podcastId }: { podcastId: string }) {
  const addYoutubeUrlsMutation = useAddYoutubeUrls();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      youtubeUrls: [{ url: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "youtubeUrls",
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const urls = data.youtubeUrls.filter((item) => item.url.trim() !== "").map((item) => item.url.trim());
    addYoutubeUrlsMutation.mutate({
      urls,
      podcastId,
    });
    form.reset();
  }

  function isValidYoutubeUrl(url: string) {
    return youtubeUrlRegex.test(url);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    form.setValue(`youtubeUrls.${index}.url`, e.target.value, { shouldValidate: true });
    if (index === fields.length - 1 && isValidYoutubeUrl(e.target.value)) {
      append({ url: "" });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col items-center gap-8 rounded-lg shadow-md p-8 w-xl"
      >
        <div className="w-full flex flex-col gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name={`youtubeUrls.${index}.url`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>YouTube URL {fields.length > 1 ? index + 1 : ""}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input {...field} onChange={(e) => handleInputChange(e, index)} className="w-full" />
                        {index > 0 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-4 w-full justify-between">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => append({ url: "" })}
            aria-label="Add another URL"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  );
}
