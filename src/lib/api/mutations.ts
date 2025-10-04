import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addYoutubeUrls, createPodcast, deletePodcast, deletePodcastItem, updatePodcast } from "./api";
import { handleError } from "../utils";
import type { PodcastsRecord } from "../pocketbase-types";


export function useAddYoutubeUrls() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ urls, podcastId }: { urls: string[], podcastId: string }) => addYoutubeUrls(urls, podcastId),
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
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

