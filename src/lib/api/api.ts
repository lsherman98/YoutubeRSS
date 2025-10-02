import { pb } from "../pocketbase";
import { Collections, type DownloadsResponse, type ItemsResponse, type PodcastsRecord } from "../pocketbase-types";
import { getUserId } from "../utils";

export async function addYoutubeUrls(urls: string[], podcastId: string) {
    const batch = pb.createBatch();
    urls.forEach((url) => {
        batch.collection(Collections.Items).create({
            url,
            user: getUserId(),
            podcast: podcastId,
        })
    });
    return await batch.send();
}

export async function createPodcast(data: Omit<PodcastsRecord, "id" | "image"> & { image?: File }) {
    return await pb.collection(Collections.Podcasts).create(data);
}

export async function getPodcasts() {
    return await pb.collection(Collections.Podcasts).getFullList({
        filter: `user = "${getUserId()}"`,
        sort: "-created",
    });
}

export function getPodcast(podcastId: string) {
    return pb.collection(Collections.Podcasts).getOne(podcastId);
}

export async function deletePodcast(podcastId: string) {
    return await pb.collection(Collections.Podcasts).delete(podcastId);
}

type ExpandDownload = {
    download: DownloadsResponse
}

export async function getPodcastItems(podcastId: string) {
    return await pb.collection(Collections.Items).getFullList<ItemsResponse<ExpandDownload>>({
        filter: `podcast = "${podcastId}"`,
        sort: "-created",
        expand: "download"
    });
}

export async function deletePodcastItem(itemId: string) {
    return await pb.collection(Collections.Items).delete(itemId);
}
