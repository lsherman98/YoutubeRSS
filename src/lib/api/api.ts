import { pb } from "../pocketbase";
import { Collections, type PodcastsRecord } from "../pocketbase-types";
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

export async function createPodcast(data: Omit<PodcastsRecord, "id">) {
    return await pb.collection(Collections.Podcasts).create(data);
}

export async function getPodcasts() {
    return await pb.collection(Collections.Podcasts).getFullList({
        filter: `user = "${getUserId()}"`,
        sort: "-created",
    });
}
