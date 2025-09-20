import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { pb } from "./pocketbase";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleError(error: Error) {
  if (error instanceof Error && error.message.includes("The request was autocancelled")) {
    return;
  }
  console.error(error)
  toast.error("An error occurred", {
    description: error.message,

  })
}

export function getUserId(msg: string = 'No logged in user detected.'): string | null {
  const user = pb.authStore.record;
  if (!user?.id) {
    handleError(new Error(msg));
    return null
  }
  return user.id;
}

export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};