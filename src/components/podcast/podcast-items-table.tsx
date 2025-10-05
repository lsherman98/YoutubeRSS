import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoaderCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeletePodcastItem } from "@/lib/api/mutations";
import { formatDuration } from "@/lib/utils";
import type { DownloadsResponse, ItemsResponse } from "@/lib/pocketbase-types";
import type { ExpandDownload } from "@/lib/api/api";
import { pb } from "@/lib/pocketbase";

interface PodcastItemsTableProps {
  podcastItems: ItemsResponse<ExpandDownload>[];
}

export function PodcastItemsTable({ podcastItems }: PodcastItemsTableProps) {
  const deleteItemMutation = useDeletePodcastItem();

  const handleDownload = (download: DownloadsResponse) => {
    const fileUrl = pb.files.getURL(download, download.file, { download: true });
    window.open(fileUrl, "_blank");
  };

  return (
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
                      <DropdownMenuItem onClick={() => handleDownload(item.expand.download)}>Download</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
