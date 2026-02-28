/**
 * AI related types for Poe API and other AI services.
 */

// ============================================
// Poe API Types
// ============================================

export interface PoeMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PoeChatRequest {
  model: string;
  messages: PoeMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface PoeChatChoice {
  index: number;
  message: {
    role: "assistant";
    content: string;
  };
  finish_reason: "stop" | "length" | "content_filter" | null;
}

export interface PoeUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface PoeChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: PoeChatChoice[];
  usage: PoeUsage;
}

export interface PoeError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

// ============================================
// Outline Generation Types
// ============================================

export interface OutlineGenerationInput {
  seriesTitle: string;
  seriesDescription?: string;
  artStyle: string;
  worldSetting: string;
  totalEpisodes: number;
}

export interface CharacterOutline {
  name: string;
  role: "protagonist" | "supporting" | "minor" | "antagonist";
  appearance: string;
  personality: string;
  background: string;
}

export interface WorldSceneOutline {
  name: string;
  description: string;
  atmosphere: string;
}

export interface EpisodeOutline {
  episode_number: number;
  title: string;
  synopsis: string;
}

export interface OutlineGenerationOutput {
  content: string;
  characters: CharacterOutline[];
  world_scenes: WorldSceneOutline[];
  episode_outlines: EpisodeOutline[];
}

// ============================================
// Script Generation Types
// ============================================

export interface ScriptGenerationInput {
  seriesTitle: string;
  artStyle: string;
  worldSetting: string;
  characters: Array<{
    name: string;
    role: string;
    appearance: string;
    personality: string;
  }>;
  worldScenes: Array<{
    name: string;
    description: string;
    atmosphere: string;
  }>;
  episodeNumber: number;
  episodeTitle: string;
  episodeSynopsis: string;
}

export interface ScriptGenerationOutput {
  content: string;
}

// ============================================
// Scene Script Generation Types
// ============================================

export interface SceneScriptGenerationInput {
  seriesTitle: string;
  artStyle: string;
  characters: Array<{
    name: string;
    appearance: string;
    personality: string;
  }>;
  worldScenes: Array<{
    name: string;
    description: string;
    atmosphere: string;
  }>;
  episodeNumber: number;
  scriptContent: string;
}

export interface SceneScriptItem {
  order_index: number;
  scene_description: string;
  character_description: string;
  dialogue: string;
  action_description: string;
  suggested_world_scene?: string;
  suggested_characters?: string[];
}

export interface SceneScriptGenerationOutput {
  scenes: SceneScriptItem[];
}

// ============================================
// Retry Configuration
// ============================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  retryableErrors: string[];
}

// ============================================
// AI Model Configuration
// ============================================

export type PoeModel =
  | "gemini-3-flash"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "claude-3-5-sonnet"
  | "claude-3-opus";

export interface AIModelConfig {
  model: PoeModel;
  temperature?: number;
  maxTokens?: number;
}

// ============================================
// 火山引擎即梦 API Types
// ============================================

export type JimengModel = "jimeng_t2i_v40";

export type ImageGenerationStatus = "in_queue" | "generating" | "done" | "failed";

export interface JimengSubmitTaskRequest {
  req_key: JimengModel;
  prompt: string;
  image_urls?: string[];
  scale?: number;
  width?: number;
  height?: number;
  use_sr?: boolean;
  sr_scale?: number;
}

export interface JimengSubmitTaskResponse {
  code: number;
  message: string;
  status: number;
  request_id: string;
  data: {
    task_id: string;
  };
  time_elapsed: string;
}

export interface JimengGetResultRequest {
  req_key: JimengModel;
  task_id: string;
  req_json?: string;
}

export interface JimengGetResultResponse {
  code: number;
  message: string;
  status: number;
  request_id: string;
  data: {
    status: ImageGenerationStatus;
    image_urls: string[] | null;
    binary_data_base64: string[] | null;
    video_url: string;
    aigc_meta_tagged: boolean;
  };
  time_elapsed: string;
}

// ============================================
// 角色三视图生成 Types
// ============================================

export type CharacterViewType = "front" | "side" | "back";

export interface CharacterImageGenerationInput {
  characterName: string;
  appearance: string;
  personality: string;
  artStyle: string;
  viewType: CharacterViewType;
}

export interface CharacterImageGenerationResult {
  taskId: string;
  status: ImageGenerationStatus;
  imageUrl?: string;
  error?: string;
}

// ============================================
// 场景图生成 Types
// ============================================

export interface SceneImageGenerationInput {
  sceneName: string;
  description: string;
  atmosphere: string;
  artStyle: string;
}

export interface SceneImageGenerationResult {
  taskId: string;
  status: ImageGenerationStatus;
  imageUrl?: string;
  error?: string;
}

// ============================================
// 分镜参考图生成 Types
// ============================================

export interface SceneReferenceImageInput {
  sceneDescription: string;
  characterDescription: string;
  actionDescription: string;
  artStyle: string;
  referenceImageUrl?: string;
}

export interface SceneReferenceImageResult {
  taskId: string;
  status: ImageGenerationStatus;
  imageUrl?: string;
  error?: string;
}

// ============================================
// 即梦 API 配置
// ============================================

export interface JimengConfig {
  accessKey: string;
  secretKey: string;
  region?: string;
  host?: string;
  endpoint?: string;
}

export interface JimengRetryConfig extends RetryConfig {
  pollingInterval: number; // milliseconds
  maxPollingAttempts: number;
}