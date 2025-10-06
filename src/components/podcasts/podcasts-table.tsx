import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeletePodcast } from "@/lib/api/mutations";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Trash, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PodcastsResponse } from "@/lib/pocketbase-types";
import { useState, useMemo } from "react";

interface PodcastsTableProps {
  podcasts: PodcastsResponse[];
}

export function PodcastsTable({ podcasts }: PodcastsTableProps) {
  const deletePodcastMutation = useDeletePodcast();
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<"title" | "created" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: "title" | "created") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedPodcasts = useMemo(() => {
    if (!sortColumn || !Array.isArray(podcasts)) return podcasts;

    return [...podcasts].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortColumn === "title") {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else {
        aValue = new Date(a.created).getTime();
        bValue = new Date(b.created).getTime();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [podcasts, sortColumn, sortDirection]);

  const SortIcon = ({ column }: { column: "title" | "created" }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="relative h-[calc(100vh-156px)] overflow-auto">
      <Table className="w-full">
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("title")}
                className="flex items-center p-0 hover:bg-transparent"
              >
                Title
                <SortIcon column="title" />
              </Button>
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("created")}
                className="flex items-center p-0 hover:bg-transparent"
              >
                Created
                <SortIcon column="created" />
              </Button>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="">
          {Array.isArray(sortedPodcasts) &&
            sortedPodcasts.map((podcast) => (
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
    </div>
  );
}
