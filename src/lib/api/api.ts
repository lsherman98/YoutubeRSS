import { pb } from "../pocketbase";
import { Collections, ItemsTypeOptions, type DownloadsResponse, type ItemsResponse, type PodcastsRecord, type UploadsResponse } from "../pocketbase-types";
import { getUserId } from "../utils";

export async function addYoutubeUrls(urls: string[], podcastId: string) {
    const batch = pb.createBatch();
    urls.forEach((url) => {
        batch.collection(Collections.Items).create({
            url,
            user: getUserId(),
            podcast: podcastId,
            type: ItemsTypeOptions.url
        })
    });
    return await batch.send();
}

export type AudioUpload = {
    file: File;
    title: string;
}

export async function addAudioFiles(files: AudioUpload[], podcastId: string) {
    const batch = pb.createBatch();
    for (const { file, title } of files) {
        const duration = await getAudioDuration(file);
        batch.collection(Collections.Uploads).create({
            file,
            user: getUserId(),
            podcast: podcastId,
            title: title,
            size: file.size,
            duration,
        })
    }
    return await batch.send();
}

async function getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.addEventListener("loadedmetadata", () => {
            resolve(audio.duration);
            URL.revokeObjectURL(audio.src);
        });
        audio.addEventListener("error", (error) => {
            reject(error);
            URL.revokeObjectURL(audio.src);
        });
    });
}

export async function createPodcast(data: Omit<PodcastsRecord, "id" | "image"> & { image?: File }) {
    return await pb.collection(Collections.Podcasts).create(data);
}

export async function updatePodcast(id: string, data: Partial<PodcastsRecord & { image?: File }>) {
    return await pb.collection(Collections.Podcasts).update(id, data);
}

export async function deletePodcast(podcastId: string) {
    return await pb.collection(Collections.Podcasts).delete(podcastId);
}

export function getPodcast(podcastId: string) {
    return pb.collection(Collections.Podcasts).getOne(podcastId);
}

export async function getPodcasts() {
    return await pb.collection(Collections.Podcasts).getFullList({
        filter: `user = "${getUserId()}"`,
        sort: "-created",
    });
}

export type ExpandItem = {
    download: DownloadsResponse
    upload: UploadsResponse
}

export async function getPodcastItems(podcastId: string) {
    return await pb.collection(Collections.Items).getFullList<ItemsResponse<ExpandItem>>({
        filter: `podcast = "${podcastId}"`,
        sort: "-created",
        expand: "download,upload",
    });
}

export async function deletePodcastItem(itemId: string) {
    return await pb.collection(Collections.Items).delete(itemId);
}

type ShareUrlResponse = {
    url: string;
}

export async function getPodcastShareUrl(podcastId: string, platform: string) {
    return await pb.send<ShareUrlResponse>(`/api/share_url/${podcastId}/${platform}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
}
