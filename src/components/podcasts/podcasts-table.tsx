import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeletePodcast } from "@/lib/api/mutations";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PodcastsResponse } from "@/lib/pocketbase-types";

interface PodcastsTableProps {
  podcasts: PodcastsResponse[];
}

export function PodcastsTable({ podcasts }: PodcastsTableProps) {
  const deletePodcastMutation = useDeletePodcast();
  const navigate = useNavigate();

  return (
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
        {Array.isArray(podcasts) &&
          podcasts.map((podcast) => (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePodcastMutation.mutate(podcast.id);
                      }}
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
  );
}
