import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAPIKeys, getJobs, getPodcast, getPodcastItems, getPodcasts, getUsage, getWebhook, getWebhookEvents } from "./api";
import { JobsStatusOptions, WebhookEventsStatusOptions, type ItemsResponse, type JobsResponse, type WebhookEventsResponse } from "../pocketbase-types";

export function useGetPodcasts() {
    return useQuery({
        queryKey: ['podcasts'],
        queryFn: getPodcasts,
        placeholderData: keepPreviousData
    });
}

export function useGetPodcast(podcastId: string) {
    return useQuery({
        queryKey: ['podcast', podcastId],
        queryFn: () => getPodcast(podcastId),
        placeholderData: keepPreviousData
    });
}

export function useGetPodcastItems(podcastId: string) {
    return useQuery({
        queryKey: ['items', podcastId],
        queryFn: () => getPodcastItems(podcastId),
        placeholderData: keepPreviousData,
        refetchInterval: (query) => {
            if (query.state.data && query.state.data.some((item: ItemsResponse) => !item.download)) {
                return 3000;
            }
            return false;
        }
    });
}

export function useGetJobs() {
    return useQuery({
        queryKey: ['jobs'],
        queryFn: () => getJobs(),
        placeholderData: keepPreviousData,
        refetchInterval: (query) => {
            if (query.state.data && query.state.data.some((job: JobsResponse) => [JobsStatusOptions.CREATED, JobsStatusOptions.STARTED, JobsStatusOptions.PROCESSING].includes(job.status))) {
                return 3000;
            }
            return false;
        }
    })
}

export function useGetAPIKeys() {
    return useQuery({
        queryKey: ['apiKeys'],
        queryFn: () => getAPIKeys(),
        placeholderData: keepPreviousData
    });
}

export function useGetUsage() {
    return useQuery({
        queryKey: ['usage'],
        queryFn: () => getUsage(),
        placeholderData: keepPreviousData
    });
}

export function useGetWebhook() {
    return useQuery({
        queryKey: ['webhook'],
        queryFn: () => getWebhook(),
        placeholderData: keepPreviousData
    });
}

export function useGetWebhookEvents() {
    return useQuery({
        queryKey: ['webhookEvents'],
        queryFn: () => getWebhookEvents(),
        placeholderData: keepPreviousData,
        refetchInterval: (query) => {
            if (query.state.data && query.state.data.some((event: WebhookEventsResponse) => event.status === WebhookEventsStatusOptions.ACTIVE)) {
                return 3000;
            }
            return false;
        }
    });
}