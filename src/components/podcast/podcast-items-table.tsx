import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoaderCircle, MoreHorizontal, Youtube, Upload, AlertCircle, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeletePodcastItem } from "@/lib/api/mutations";
import { formatDuration, formatFileSize } from "@/lib/utils";
import type { ItemsResponse } from "@/lib/pocketbase-types";
import { ItemsStatusOptions, ItemsTypeOptions } from "@/lib/pocketbase-types";
import type { ExpandItem } from "@/lib/api/api";
import { pb } from "@/lib/pocketbase";

interface PodcastItemsTableProps {
  podcastItems: ItemsResponse<ExpandItem>[];
}

export function PodcastItemsTable({ podcastItems }: PodcastItemsTableProps) {
  const deleteItemMutation = useDeletePodcastItem();

  const handleDownload = (item: ItemsResponse<ExpandItem>) => {
    const expandData = item.type === ItemsTypeOptions.upload ? item.expand.upload : item.expand.download;
    if (expandData) {
      const fileUrl = pb.files.getURL(expandData, expandData.file, { download: true, v: Date.now() });
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="h-[calc(100vh-254px)] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Url</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(podcastItems) &&
            podcastItems.map((item) => {
              if (item.status === ItemsStatusOptions.CREATED) {
                return (
                  <TableRow key={item.id}>
                    <TableCell colSpan={8} className="text-center">
                      <div className="flex items-center justify-center py-2 bg-gray-100 rounded">
                        <LoaderCircle className="h-6 w-6 animate-spin mr-2" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              if (item.status === ItemsStatusOptions.ERROR) {
                return (
                  <TableRow key={item.id}>
                    <TableCell colSpan={9}>
                      <div className="flex items-center justify-between py-2 px-2 bg-red-50 rounded">
                        <div className="flex items-center gap-2 flex-1">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          <span className="text-red-700 text-sm">{item.error || "An error occurred"}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItemMutation.mutate(item.id)}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                          title="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              const isUpload = item.type === ItemsTypeOptions.upload;
              const data = isUpload ? item.expand.upload : item.expand.download;

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    {isUpload ? (
                      <div title="Audio Upload">
                        <Upload className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : (
                      <div title="YouTube Download">
                        <Youtube className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[350px] truncate" title={data?.title}>
                    {data?.title}
                  </TableCell>
                  <TableCell>{data?.duration ? formatDuration(data.duration) : "-"}</TableCell>
                  <TableCell className="max-w-[150px]" title={item.expand.download?.channel}>
                    {isUpload ? "-" : item.expand.download?.channel}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={item.url}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">
                        {item.url}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{data?.size ? formatFileSize(data.size) : "-"}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleDownload(item)}>Download</DropdownMenuItem>
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
