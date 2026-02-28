/**
 * Video processing related types.
 */

// ============================================
// Video Concatenation Types
// ============================================

export interface VideoSource {
  url: string;
  order: number;
  duration?: number; // in seconds
  storagePath?: string;
}

export interface ConcatConfig {
  outputFormat: "mp4" | "webm";
  outputQuality: "high" | "medium" | "low";
}

export interface ConcatProgress {
  status: "pending" | "downloading" | "processing" | "uploading" | "completed" | "failed";
  progress: number; // 0-100
  currentStep?: string;
  error?: string;
}

export interface ConcatResult {
  success: boolean;
  url?: string;
  storagePath?: string;
  duration?: number; // total duration in seconds
  error?: string;
}

export interface EpisodeConcatInput {
  episodeId: string;
  videos: VideoSource[];
  config?: Partial<ConcatConfig>;
}

// ============================================
// FFmpeg Types (re-exported from @ffmpeg/ffmpeg)
// ============================================

export type { LogEvent, ProgressEvent } from "@ffmpeg/ffmpeg";

// ============================================
// Video Processing Status
// ============================================

export type VideoConcatStatus =
  | "pending"
  | "downloading"
  | "processing"
  | "uploading"
  | "completed"
  | "failed";

export interface VideoConcatTask {
  id: string;
  episodeId: string;
  status: VideoConcatStatus;
  progress: number;
  totalVideos: number;
  processedVideos: number;
  outputUrl?: string;
  storagePath?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}