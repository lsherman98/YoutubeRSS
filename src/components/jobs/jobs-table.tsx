import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import type { JobsResponse } from "@/lib/pocketbase-types";
import { JobsStatusOptions } from "@/lib/pocketbase-types";
import type { ExpandJobs } from "@/lib/api/api";
import { pb } from "@/lib/pocketbase";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatFileSize } from "@/lib/utils";

interface JobsTableProps {
  jobs: JobsResponse<ExpandJobs>[];
}

export function JobsTable({ jobs }: JobsTableProps) {
  const handleDownload = (job: JobsResponse<ExpandJobs>) => {
    if (job.download && job.expand?.download) {
      const fileUrl = pb.files.getURL(job.expand.download, job.expand.download.file, { download: true, v: Date.now() });
      window.open(fileUrl, "_blank");
    }
  };

  const getStatusBadge = (status: JobsStatusOptions) => {
    switch (status) {
      case JobsStatusOptions.CREATED:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Created
          </Badge>
        );
      case JobsStatusOptions.STARTED:
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-purple-600 border-purple-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Started
          </Badge>
        );
      case JobsStatusOptions.PROCESSING:
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case JobsStatusOptions.SUCCESS:
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3" />
            Success
          </Badge>
        );
      case JobsStatusOptions.ERROR:
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-600">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="relative h-[calc(100vh-156px)] overflow-auto">
      <Table className="w-full">
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(jobs) && jobs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No jobs yet. Create your first job to get started!
              </TableCell>
            </TableRow>
          )}
          {Array.isArray(jobs) &&
            jobs.map((job) => (
              <TableRow key={job.id} className="hover:bg-muted">
                <TableCell>
                  {job.status === JobsStatusOptions.ERROR && job.error ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">{getStatusBadge(job.status)}</div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <p className="font-semibold mb-1">Error Details:</p>
                          <p className="text-sm">{job.error}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    getStatusBadge(job.status)
                  )}
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                    title={job.url}
                  >
                    {job.url}
                  </a>
                </TableCell>
                <TableCell className="max-w-[250px] truncate" title={job.expand?.download?.title}>
                  {job.expand?.download?.title || "-"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={job.expand?.download?.channel}>
                  {job.expand?.download?.channel || "-"}
                </TableCell>
                <TableCell>{job.expand?.download?.size ? formatFileSize(job.expand.download.size) : "-"}</TableCell>
                <TableCell>{new Date(job.created).toLocaleString()}</TableCell>
                <TableCell>
                  {job.status === JobsStatusOptions.SUCCESS && job.download ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(job)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
