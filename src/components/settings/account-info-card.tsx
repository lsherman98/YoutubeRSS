import { useState } from "react";
import { toast } from "sonner";
import { User, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { pb } from "@/lib/pocketbase";
import { useUpdateUsername } from "@/lib/api/mutations";

export function AccountInfoCard() {
  const user = pb.authStore.model;
  const updateUsernameMutation = useUpdateUsername();

  const [username, setUsername] = useState(user?.name || "");
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    try {
      await updateUsernameMutation.mutateAsync(username);
      toast.success("Username updated successfully");
      setIsEditingUsername(false);
    } catch (error: any) {
      toast.error("Failed to update username");
    }
  };

  return (
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
  );
}
