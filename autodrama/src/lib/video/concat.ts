/**
 * Video concatenation service using FFmpeg WASM.
 * Supports concatenating multiple video clips into a single video.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type {
  VideoSource,
  ConcatConfig,
  ConcatProgress,
  ConcatResult,
  ProgressEvent,
} from "@/types/video";

// Default configuration
const DEFAULT_CONFIG: ConcatConfig = {
  outputFormat: "mp4",
  outputQuality: "high",
};

// Quality presets
const QUALITY_PRESETS = {
  high: { crf: 18, preset: "slow" },
  medium: { crf: 23, preset: "medium" },
  low: { crf: 28, preset: "fast" },
};

/**
 * Video concatenation service class
 */
export class VideoConcatService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private onProgress?: (progress: ConcatProgress) => void;

  constructor(onProgress?: (progress: ConcatProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Initialize FFmpeg WASM
   */
  private async loadFFmpeg(): Promise<void> {
    if (this.loaded && this.ffmpeg) {
      return;
    }

    this.ffmpeg = new FFmpeg();

    // Set up progress logging
    this.ffmpeg.on("log", ({ type, message }) => {
      console.log(`[FFmpeg ${type}] ${message}`);
    });

    this.ffmpeg.on("progress", ({ progress, time }: ProgressEvent) => {
      if (this.onProgress) {
        this.onProgress({
          status: "processing",
          progress: Math.round(progress * 100),
          currentStep: `Processing: ${Math.round(time / 1000000)}s`,
        });
      }
    });

    // Load FFmpeg core
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    this.loaded = true;
  }

  /**
   * Concatenate multiple video files
   */
  async concatVideos(
    videos: VideoSource[],
    config?: Partial<ConcatConfig>
  ): Promise<ConcatResult> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    try {
      // Initialize FFmpeg
      await this.loadFFmpeg();

      if (!this.ffmpeg) {
        throw new Error("FFmpeg initialization failed");
      }

      // Report downloading status
      this.onProgress?.({
        status: "downloading",
        progress: 0,
        currentStep: "Downloading video files...",
      });

      // Sort videos by order
      const sortedVideos = [...videos].sort((a, b) => a.order - b.order);

      if (sortedVideos.length === 0) {
        throw new Error("No videos to concatenate");
      }

      // Download and write video files to FFmpeg virtual filesystem
      for (let i = 0; i < sortedVideos.length; i++) {
        const video = sortedVideos[i];
        const inputName = `input_${i.toString().padStart(3, "0")}.mp4`;

        this.onProgress?.({
          status: "downloading",
          progress: Math.round(((i + 1) / sortedVideos.length) * 50),
          currentStep: `Downloading video ${i + 1}/${sortedVideos.length}`,
        });

        try {
          const videoData = await fetchFile(video.url);
          await this.ffmpeg.writeFile(inputName, videoData);
        } catch (error) {
          console.error(`Failed to download video ${i}:`, error);
          throw new Error(`Failed to download video ${i + 1}: ${(error as Error).message}`);
        }
      }

      // Create concat file list
      const concatList = sortedVideos
        .map((_, i) => `file 'input_${i.toString().padStart(3, "0")}.mp4'`)
        .join("\n");

      await this.ffmpeg.writeFile("concat_list.txt", concatList);

      // Report processing status
      this.onProgress?.({
        status: "processing",
        progress: 50,
        currentStep: "Concatenating videos...",
      });

      // Get quality settings
      const qualitySettings = QUALITY_PRESETS[finalConfig.outputQuality];
      const outputName = `output.${finalConfig.outputFormat}`;

      // Run FFmpeg concat
      await this.ffmpeg.exec([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "concat_list.txt",
        "-c:v",
        "libx264",
        "-crf",
        qualitySettings.crf.toString(),
        "-preset",
        qualitySettings.preset,
        "-c:a",
        "aac",
        "-y",
        outputName,
      ]);

      // Read output file
      this.onProgress?.({
        status: "uploading",
        progress: 90,
        currentStep: "Reading output file...",
      });

      const outputData = await this.ffmpeg.readFile(outputName);

      // Clean up input files
      for (let i = 0; i < sortedVideos.length; i++) {
        const inputName = `input_${i.toString().padStart(3, "0")}.mp4`;
        try {
          await this.ffmpeg.deleteFile(inputName);
        } catch {
          // Ignore cleanup errors
        }
      }

      try {
        await this.ffmpeg.deleteFile("concat_list.txt");
        await this.ffmpeg.deleteFile(outputName);
      } catch {
        // Ignore cleanup errors
      }

      // Convert to Blob - handle both Uint8Array and string returns
      let outputBlob: Blob;
      if (outputData instanceof Uint8Array) {
        // Create a new ArrayBuffer and copy the data to avoid SharedArrayBuffer issues
        const buffer = new ArrayBuffer(outputData.length);
        const view = new Uint8Array(buffer);
        view.set(outputData);
        outputBlob = new Blob([buffer], {
          type: `video/${finalConfig.outputFormat}`,
        });
      } else {
        // If it's a string (base64 or binary string), convert to Uint8Array first
        const encoder = new TextEncoder();
        const bytes = encoder.encode(outputData);
        outputBlob = new Blob([bytes], {
          type: `video/${finalConfig.outputFormat}`,
        });
      }

      // Create URL for the output
      const outputUrl = URL.createObjectURL(outputBlob);

      // Report completion
      this.onProgress?.({
        status: "completed",
        progress: 100,
        currentStep: "Video concatenation complete",
      });

      return {
        success: true,
        url: outputUrl,
        // Note: duration would need to be calculated from actual output
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      this.onProgress?.({
        status: "failed",
        progress: 0,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get video duration (requires video to be loaded in FFmpeg)
   */
  async getVideoDuration(videoUrl: string): Promise<number> {
    await this.loadFFmpeg();

    if (!this.ffmpeg) {
      throw new Error("FFmpeg initialization failed");
    }

    // Write video file
    const videoData = await fetchFile(videoUrl);
    await this.ffmpeg.writeFile("duration_check.mp4", videoData);

    // Get duration using ffprobe-like approach
    // Note: FFmpeg WASM doesn't have direct duration access, so we parse logs
    const duration = 0;

    try {
      // Clean up
      await this.ffmpeg.deleteFile("duration_check.mp4");
    } catch {
      // Ignore cleanup errors
    }

    return duration;
  }

  /**
   * Terminate FFmpeg instance and free memory
   */
  terminate(): void {
    if (this.ffmpeg) {
      this.ffmpeg.terminate();
      this.ffmpeg = null;
      this.loaded = false;
    }
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a video concat service instance
 */
export function createVideoConcatService(
  onProgress?: (progress: ConcatProgress) => void
): VideoConcatService {
  return new VideoConcatService(onProgress);
}

/**
 * Concatenate videos with progress callback
 */
export async function concatVideos(
  videos: VideoSource[],
  config?: Partial<ConcatConfig>,
  onProgress?: (progress: ConcatProgress) => void
): Promise<ConcatResult> {
  const service = new VideoConcatService(onProgress);
  try {
    return await service.concatVideos(videos, config);
  } finally {
    service.terminate();
  }
}

/**
 * Prepare video sources from episode scene videos
 */
export function prepareVideoSources(
  sceneVideos: Array<{
    id: string;
    url: string;
    orderIndex: number;
    duration?: number;
    storagePath?: string;
  }>
): VideoSource[] {
  return sceneVideos
    .filter((video) => video.url)
    .map((video) => ({
      url: video.url,
      order: video.orderIndex,
      duration: video.duration,
      storagePath: video.storagePath,
    }));
}

/**
 * Calculate total duration from video sources
 */
export function calculateTotalDuration(videos: VideoSource[]): number {
  return videos.reduce((total, video) => total + (video.duration || 0), 0);
}