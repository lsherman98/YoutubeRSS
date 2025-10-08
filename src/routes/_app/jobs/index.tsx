import { createFileRoute } from "@tanstack/react-router";
import { JobsTable } from "@/components/jobs/jobs-table";
import { useGetJobs } from "@/lib/api/queries";
import { useState } from "react";
import { CreateJobDialog } from "@/components/jobs/create-job-dialog";

export const Route = createFileRoute("/_app/jobs/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: jobs } = useGetJobs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="w-full flex justify-end mb-6">
        <CreateJobDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>
      <JobsTable jobs={jobs || []} />
    </div>
  );
}
