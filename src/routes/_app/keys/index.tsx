import { useState } from "react";
import { useGenerateAPIKey, useRevokeAPIKey } from "@/lib/api/mutations";
import { useGetAPIKeys } from "@/lib/api/queries";
import { createFileRoute } from "@tanstack/react-router";
import { APIKeysTable } from "@/components/keys/api-keys-table";
import { GenerateAPIKeyDialog } from "@/components/keys/generate-api-key-dialog";
import { ShowAPIKeyDialog } from "@/components/keys/show-api-key-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/keys/")({
  component: RouteComponent,
});

function RouteComponent() {
  const generateApiKeyMutation = useGenerateAPIKey();
  const revokeApiKeyMutation = useRevokeAPIKey();
  const { data: apiKeys } = useGetAPIKeys();

  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedKeyTitle, setGeneratedKeyTitle] = useState("");

  const handleGenerateKey = async (title: string) => {
    try {
      const result = await generateApiKeyMutation.mutateAsync(title);
      setGeneratedKey(result.api_key);
      setGeneratedKeyTitle(title);
      setShowKeyDialog(true);
    } catch (error) {
      toast.error("Failed to generate API key");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeApiKeyMutation.mutateAsync(keyId);
      toast.success("API key revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke API key");
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-2">Manage your API keys for CLI and API access to your account</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
            </div>
            <GenerateAPIKeyDialog
              onGenerate={(title) => handleGenerateKey(title)}
              isPending={generateApiKeyMutation.isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          <APIKeysTable keys={apiKeys || []} onRevoke={handleRevokeKey} isRevoking={revokeApiKeyMutation.isPending} />
        </CardContent>
      </Card>
      <ShowAPIKeyDialog
        isOpen={showKeyDialog}
        onOpenChange={setShowKeyDialog}
        apiKey={generatedKey}
        keyTitle={generatedKeyTitle}
      />
    </div>
  );
}
