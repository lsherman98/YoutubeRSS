import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrashIcon, KeyIcon } from "lucide-react";
import type { ApiKeysResponse } from "@/lib/pocketbase-types";
import { formatDistanceToNow } from "date-fns";

interface APIKeysTableProps {
  keys: ApiKeysResponse[];
  onRevoke: (keyId: string) => void;
  isRevoking: boolean;
}

export function APIKeysTable({ keys, onRevoke, isRevoking }: APIKeysTableProps) {
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);

  const handleRevoke = () => {
    if (revokeKeyId) {
      onRevoke(revokeKeyId);
      setRevokeKeyId(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <KeyIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Keys</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You haven't created any keys yet. Generate one to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(key.created), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setRevokeKeyId(key.id)} disabled={isRevoking}>
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!revokeKeyId} onOpenChange={() => setRevokeKeyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone and any applications using this
              key will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeKeyId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={isRevoking}>
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
