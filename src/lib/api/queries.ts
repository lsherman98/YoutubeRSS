import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getPodcast, getPodcastItems, getPodcasts } from "./api";

export function useGetPodcasts() {
    return useQuery({
        queryKey: ['podcasts'],
        queryFn: getPodcasts,
        placeholderData: keepPreviousData
    });
}

export function useGetPodcast(podcastId: string) {
    return useQuery({
        queryKey: ['podcasts'],
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
            if (query.state.data && query.state.data.some((item: any) => !item.download)) {
                return 5000; 
            }
            return false; 
        }
    });
}