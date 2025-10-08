import { pb } from "../pocketbase";
import { Collections, ItemsTypeOptions, JobsStatusOptions, type DownloadsResponse, type ItemsResponse, type JobsResponse, type PodcastsRecord, type UploadsResponse, type WebhooksRecord } from "../pocketbase-types";
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

export async function generateAPIKey(title: string) {
    return await pb.collection(Collections.ApiKeys).create<{ api_key: string }>({ user: getUserId(), title });
}

export async function revokeAPIKey(keyId: string) {
    return await pb.collection(Collections.ApiKeys).delete(keyId);
}

export async function getAPIKeys() {
    return await pb.collection(Collections.ApiKeys).getFullList({
        sort: "-created",
    });
}

export async function createJobs(urls: string[]) {
    const res = await pb.send<{ batchId: string }>("/api/generate-batch-id", { method: 'GET' });
    const batchId = res.batchId;

    const batch = pb.createBatch();
    urls.forEach((url) => {
        batch.collection(Collections.Jobs).create({ user: getUserId(), status: JobsStatusOptions.CREATED, url, batch_id: batchId });
    });
    return await batch.send();
}

export type ExpandJobs = {
    download: DownloadsResponse
}

export async function getJobs() {
    return await pb.collection<JobsResponse<ExpandJobs>>(Collections.Jobs).getFullList({
        sort: "-created",
        expand: "download",
    });
}

export async function getUsage() {
    return await pb.collection(Collections.MonthlyUsage).getFirstListItem(`billing_cycle_end >= "${new Date().toISOString()}"`)
}

export async function createWebhook(data: Partial<WebhooksRecord>) {
    return await pb.collection(Collections.Webhooks).create({ user: getUserId(), ...data, enabled: true });
}

export async function getWebhook() {
    try {
        return await pb.collection(Collections.Webhooks).getFirstListItem("");
    } catch (error) {
        return null;
    }
}

export async function updateWebhook(id: string, data: Partial<WebhooksRecord>) {
    return await pb.collection(Collections.Webhooks).update(id, data);
}

export async function deleteWebhook(id: string) {
    return await pb.collection(Collections.Webhooks).delete(id);
}

export async function getWebhookEvents() {
    return await pb.collection(Collections.WebhookEvents).getFullList({
        sort: "-created",
    });
}
