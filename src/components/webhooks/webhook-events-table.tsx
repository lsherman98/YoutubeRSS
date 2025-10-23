import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  WebhookEventsEventOptions,
  WebhookEventsStatusOptions,
  type WebhookEventsResponse,
} from "@/lib/pocketbase-types";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, Loader2, Webhook } from "lucide-react";

interface WebhookEventsTableProps {
  events: WebhookEventsResponse[];
}

export function WebhookEventsTable({ events }: WebhookEventsTableProps) {
  const getStatusBadge = (status: WebhookEventsStatusOptions) => {
    switch (status) {
      case WebhookEventsStatusOptions.SUCCESS:
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case WebhookEventsStatusOptions.FAILED:
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case WebhookEventsStatusOptions.ACTIVE:
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Active
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventBadge = (event: WebhookEventsEventOptions) => {
    const colors: Record<WebhookEventsEventOptions, string> = {
      [WebhookEventsEventOptions.CREATED]: "bg-gray-100 text-gray-800",
      [WebhookEventsEventOptions.STARTED]: "bg-blue-100 text-blue-800",
      [WebhookEventsEventOptions.SUCCESS]: "bg-green-100 text-green-800",
      [WebhookEventsEventOptions.ERROR]: "bg-red-100 text-red-800",
    };

    return <Badge className={colors[event]}>{event}</Badge>;
  };

  return (
    <div className="relative h-[calc(47vh-6px)] overflow-auto">
      {events.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
          <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Events</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Webhook events will appear here once your webhook starts receiving notifications.
          </p>
        </div>
      ) : (
        <Table className="w-full">
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Webhook Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  {event.event ? getEventBadge(event.event) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {event.status ? getStatusBadge(event.status) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{event.attempts || 0}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
