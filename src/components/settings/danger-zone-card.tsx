import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { pb } from "@/lib/pocketbase";
import { useDeleteAccount } from "@/lib/api/mutations";

export function DangerZoneCard() {
  const deleteAccountMutation = useDeleteAccount();

  const handleDeleteAccount = async () => {
    await deleteAccountMutation.mutateAsync().then(() => {
      toast.success("Account deleted successfully");
      pb.authStore.clear();
      window.location.href = "/";
    });
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>Irreversible and destructive actions</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  This action cannot be undone. This will permanently delete your account and remove all your data from
                  our servers, including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All your podcasts</li>
                  <li>All your uploads and audio files</li>
                  <li>All your API keys</li>
                  <li>All your webhooks</li>
                  <li>Your subscription information</li>
                </ul>
                <p className="font-semibold mt-4">This action is permanent and cannot be reversed.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
