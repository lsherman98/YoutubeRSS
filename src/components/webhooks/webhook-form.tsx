import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WebhooksEventsOptions, type WebhooksRecord, type WebhooksResponse } from "@/lib/pocketbase-types";
import { Trash2 } from "lucide-react";

interface WebhookFormProps {
  webhook?: WebhooksResponse;
  onSubmit: (data: Partial<WebhooksRecord>) => void;
  onDelete?: () => void;
  isPending: boolean;
  trigger: React.ReactNode;
}

const EVENT_OPTIONS = [
  {
    value: WebhooksEventsOptions.CREATED,
    label: "Created",
    description: "Triggered when a new job is created",
  },
  {
    value: WebhooksEventsOptions.STARTED,
    label: "Started",
    description: "Triggered when a job starts processing",
  },
  {
    value: WebhooksEventsOptions.SUCCESS,
    label: "Success",
    description: "Triggered when a job completes successfully",
  },
  {
    value: WebhooksEventsOptions.ERROR,
    label: "Error",
    description: "Triggered when a job encounters an error",
  },
];

export function WebhookForm({ webhook, onSubmit, onDelete, isPending, trigger }: WebhookFormProps) {
  const [url, setUrl] = useState(webhook?.url || "");
  const [selectedEvents, setSelectedEvents] = useState<WebhooksEventsOptions[]>(webhook?.events || []);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEventToggle = (event: WebhooksEventsOptions) => {
    setSelectedEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || selectedEvents.length === 0) return;
    onSubmit({ url, events: selectedEvents });
  };

  const handleDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  const isValid = url.trim() !== "" && selectedEvents.length > 0;

  return (
    <>
      <Dialog>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{webhook ? "Edit Webhook" : "Create Webhook"}</DialogTitle>
            <DialogDescription>
              {webhook
                ? "Update your webhook configuration and event triggers"
                : "Configure a webhook to receive real-time notifications about job events"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                The URL where webhook events will be sent via POST request
              </p>
            </div>
            <div className="space-y-3">
              <Label>Event Triggers</Label>
              <p className="text-sm text-muted-foreground">Select which events should trigger this webhook</p>
              <div className="space-y-3">
                {EVENT_OPTIONS.map((event) => (
                  <div key={event.value} className="flex items-start space-x-3">
                    <Checkbox
                      id={event.value}
                      checked={selectedEvents.includes(event.value)}
                      onCheckedChange={() => handleEventToggle(event.value)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={event.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {event.label}
                      </label>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={!isValid || isPending}>
                {isPending ? "Saving..." : webhook ? "Update Webhook" : "Create Webhook"}
              </Button>
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Webhook
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
