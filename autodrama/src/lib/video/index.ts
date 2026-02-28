/**
 * Video processing module exports.
 */

export {
  VideoConcatService,
  createVideoConcatService,
  concatVideos,
  prepareVideoSources,
  calculateTotalDuration,
} from "./concat";

export type {
  VideoSource,
  ConcatConfig,
  ConcatProgress,
  ConcatResult,
  EpisodeConcatInput,
  LogEvent,
  ProgressEvent,
  VideoConcatStatus,
  VideoConcatTask,
} from "@/types/video";