import { useGetUsage } from "@/lib/api/queries";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/utils";

export function Usage() {
  const { data: usage } = useGetUsage();
  const tierLookupKey = usage?.expand?.tier.lookup_key;
  const freeTier = tierLookupKey === "free";
  const basicTier = tierLookupKey === "basic_monthly" || tierLookupKey === "basic_yearly";

  if (!usage) {
    return null;
  }

  const currentUsage = usage.usage ?? 0;
  const limit = usage.limit ?? 0;
  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;

  const currentUploads = usage.uploads ?? 0;
  const uploadsLimit = freeTier ? 15 : basicTier ? 50 : 0;
  const uploadsPercentage = uploadsLimit > 0 ? (currentUploads / uploadsLimit) * 100 : 0;

  return (
    <div className="space-y-3 px-3 py-2">
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Usage</span>
          <span className="font-medium">
            {formatFileSize(currentUsage)} / {formatFileSize(limit)}
          </span>
        </div>
        <Progress value={percentage} />
      </div>
      {(freeTier || basicTier) && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">File Uploads</span>
            <span className="font-medium">
              {currentUploads} / {uploadsLimit}
            </span>
          </div>
          <Progress value={uploadsPercentage} />
        </div>
      )}
    </div>
  );
}
