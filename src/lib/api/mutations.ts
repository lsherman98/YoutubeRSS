import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAudioFiles, addYoutubeUrls, createCheckoutSession, createIssue, createJobs, createPodcast, createPortalSession, createWebhook, deleteAccount, deletePodcast, deletePodcastItem, deleteWebhook, generateAPIKey, revokeAPIKey, updatePodcast, updateUsername, updateWebhook, type AudioUpload, type SubscriptionType } from "./api";
import { handleError } from "../utils";
import type { PodcastsRecord, WebhooksRecord } from "../pocketbase-types";

export function useAddYoutubeUrls() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ urls, podcastId }: { urls: string[], podcastId: string }) => addYoutubeUrls(urls, podcastId),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
            queryClient.invalidateQueries({ queryKey: ["usage"] });
        },
    })
}

export function useAddAudioFiles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ files, podcastId }: { files: AudioUpload[], podcastId: string }) => addAudioFiles(files, podcastId),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
            queryClient.invalidateQueries({ queryKey: ["usage"] });
        },
    })
}

export function useDeletePodcastItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemId: string) => deletePodcastItem(itemId),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
        },
    })
}

export function useCreatePodcast() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<PodcastsRecord, "id" | "image"> & { image?: File }) => createPodcast(data),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["podcasts"] });
        },
    })
}

export function useUpdatePodcast() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<PodcastsRecord & { image?: File }> }) => updatePodcast(id, data),
        onError: handleError,
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["podcast", id] });
        },
    })
}

export function useDeletePodcast() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (podcastId: string) => deletePodcast(podcastId),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["podcasts"] });
        },
    })
}

export function useGenerateAPIKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (title: string) => generateAPIKey(title),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
        },
    })
}

export function useRevokeAPIKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (keyId: string) => revokeAPIKey(keyId),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
        },
    })
}

export function useCreateJobs() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (urls: string[]) => createJobs(urls),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
        },
    })
}

export function useCreateWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<WebhooksRecord>) => createWebhook(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhook"] });
        },
    })
}

export function useUpdateWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<WebhooksRecord> }) => updateWebhook(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhook"] });
        },
    })
}

export function useDeleteWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteWebhook(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhook"] });
        },
    })
}

export function useCreateCheckoutSession() {
    return useMutation({
        mutationFn: (subscriptionType: SubscriptionType) => createCheckoutSession(subscriptionType),
        onError: handleError,
    })
}

export function useCreatePortalSession() {
    return useMutation({
        mutationFn: () => createPortalSession(),
        onError: handleError,
    })
}

export function useCreateIssue() {
    return useMutation({
        mutationFn: ({ content, screenshots }: { content: string, screenshots?: File[] }) => createIssue(content, screenshots),
        onError: handleError,
    })
}

export function useUpdateUsername() {
    return useMutation({
        mutationFn: (username: string) => updateUsername(username),
    })
}

export function useDeleteAccount() {
    return useMutation({
        mutationFn: () => deleteAccount(),
        onError: handleError,
    })
}


