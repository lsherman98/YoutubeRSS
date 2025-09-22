import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getPodcasts } from "./api";


export function useGetPodcasts() {
    return useQuery({
        queryKey: ['podcasts'],
        queryFn: getPodcasts,
        placeholderData: keepPreviousData
    });
}