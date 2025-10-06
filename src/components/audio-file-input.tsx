import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, File as FileIcon } from "lucide-react";
import { useAddAudioFiles } from "@/lib/api/mutations";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/utils";

const SUPPORTED_AUDIO_TYPES = ["audio/mp3", "audio/wav", "audio/mpeg", "audio/aac"];
const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".aac"];

type AudioFileItem = { file: File; title: string };

interface AudioFileInputProps {
  podcastId: string;
  onSuccess: () => void;
  audioItems: AudioFileItem[];
  setAudioItems: (items: AudioFileItem[]) => void;
}

export function AudioFileInput({ podcastId, onSuccess, audioItems, setAudioItems }: AudioFileInputProps) {
  const addAudioFilesMutation = useAddAudioFiles();
  const [isDragOver, setIsDragOver] = useState(false);
  const hasInvalidTitles = audioItems.some((item) => item.title.length > 0 && item.title.length < 2);

  const handleSubmit = () => {
    const filesToUpload = audioItems.map((item) => ({
      ...item,
      title: item.title.trim() || item.file.name,
    }));

    addAudioFilesMutation.mutate(
      { files: filesToUpload, podcastId },
      {
        onSuccess: () => {
          setAudioItems([]);
          onSuccess();
          toast.success("Files uploaded successfully");
        },
      }
    );
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
        const hasValidType = SUPPORTED_AUDIO_TYPES.includes(file.type);
        const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
        return hasValidType || hasValidExtension;
      });

      const newItems = droppedFiles.map((file) => ({
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
      }));
      setAudioItems([...audioItems, ...newItems].slice(0, 50));
    },
    [audioItems, setAudioItems]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newItems = selectedFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""),
    }));
    setAudioItems([...audioItems, ...newItems].slice(0, 50));
  };

  const removeFile = (index: number) => {
    setAudioItems(audioItems.filter((_, i) => i !== index));
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const newItems = [...audioItems];
    newItems[index].title = newTitle;
    setAudioItems(newItems);
  };

  const handleTitleBlur = (index: number) => {
    const newItems = [...audioItems];
    if (!newItems[index].title.trim()) {
      newItems[index].title = newItems[index].file.name.replace(/\.[^/.]+$/, "");
      setAudioItems(newItems);
    }
  };

  return (
    <>
      <label className="text-sm font-medium">Audio Files ({audioItems.length}/50)</label>
      <div
        className={`space-y-4 max-h-94 overflow-y-auto mb-2 h-full transition-all ${
          isDragOver && audioItems.length > 0 ? "border-2 border-dashed border-primary bg-primary/5 rounded-lg p-2" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {audioItems.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors h-full flex flex-col items-center justify-center  ${
              isDragOver
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop audio files here, or <span className="underline">browse</span>
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              accept={SUPPORTED_EXTENSIONS.join(",")}
              onChange={handleFileInput}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">Supports .mp3, .wav, and .aac files (max 50 files)</p>
          </div>
        )}

        {audioItems.length > 0 && (
          <div className="space-y-2">
            <div className="space-y-2 pr-2">
              {audioItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Input
                      value={item.title}
                      onChange={(e) => handleTitleChange(index, e.target.value)}
                      onBlur={() => handleTitleBlur(index)}
                      placeholder="File name"
                      className="h-8 text-sm flex-1"
                    />
                    {item.title.length > 0 && item.title.length < 2 && (
                      <p className="text-xs text-destructive">Title must be at least 2 characters.</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>({formatFileSize(item.file.size)})</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={addAudioFilesMutation.isPending || audioItems.length === 0 || hasInvalidTitles}
        className="w-full"
      >
        {addAudioFilesMutation.isPending
          ? "Uploading..."
          : `Upload ${audioItems.length} File${audioItems.length !== 1 ? "s" : ""}`}
      </Button>
    </>
  );
}
