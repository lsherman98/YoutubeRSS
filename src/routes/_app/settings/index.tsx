import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { pb } from "@/lib/pocketbase";
import { useGetUsage } from "@/lib/api/queries";
import { useUpdateUsername, useDeleteAccount } from "@/lib/api/mutations";
import { formatFileSize } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, User, Mail, CreditCard, AlertTriangle } from "lucide-react";
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

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const user = pb.authStore.model;
  const { data: usage } = useGetUsage();
  const updateUsernameMutation = useUpdateUsername();
  const deleteAccountMutation = useDeleteAccount();

  const [username, setUsername] = useState(user?.name || "");
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  const currentTier = usage?.expand?.tier?.title || "Free";
  const tierLookupKey = usage?.expand?.tier?.lookup_key || "free";

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (username === user?.name) {
      setIsEditingUsername(false);
      return;
    }

    try {
      await updateUsernameMutation.mutateAsync(username);
      toast.success("Username updated successfully");
      setIsEditingUsername(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update username");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      toast.success("Account deleted successfully");
      pb.authStore.clear();
      window.location.href = "/";
    } catch (error: any) {}
  };

  const getTierBadgeVariant = (key: string) => {
    if (key === "free") return "secondary";
    if (key.startsWith("basic")) return "default";
    if (key.startsWith("power")) return "default";
    if (key.startsWith("professional")) return "default";
    return "secondary";
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Information */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>View and manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <div className="flex items-center gap-2">
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <Badge variant="secondary">Read-only</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your email address cannot be changed. Contact support if you need assistance.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditingUsername || updateUsernameMutation.isPending}
                    className={!isEditingUsername ? "bg-muted" : ""}
                  />
                  {!isEditingUsername ? (
                    <Button onClick={() => setIsEditingUsername(true)} variant="outline">
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleUpdateUsername} disabled={updateUsernameMutation.isPending}>
                        {updateUsernameMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        onClick={() => {
                          setUsername(user?.username || "");
                          setIsEditingUsername(false);
                        }}
                        variant="outline"
                        disabled={updateUsernameMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Your current subscription tier and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Current Plan</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tierLookupKey.includes("monthly")
                      ? "Billed monthly"
                      : tierLookupKey.includes("yearly")
                      ? "Billed yearly"
                      : "Free tier"}
                  </p>
                </div>
                <Badge variant={getTierBadgeVariant(tierLookupKey)} className="text-lg px-4 py-1">
                  {currentTier.split(" ")[0]}
                </Badge>
              </div>
              {usage?.limit && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Usage</span>
                    <span className="font-medium">
                      {formatFileSize(usage.usage)} / {formatFileSize(usage.limit)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(((usage.usage || 0) / usage.limit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <a href="/subscriptions">Manage Subscription</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:w-1/2 pr-3">
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
                        This action cannot be undone. This will permanently delete your account and remove all your data
                        from our servers, including:
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
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteAccountMutation.isPending}
                    >
                      {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
