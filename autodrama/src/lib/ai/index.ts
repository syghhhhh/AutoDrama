/**
 * AI module exports
 */

// Poe API client
export { PoeClient, getPoeClient, chatCompletion } from "./poe";

// 火山引擎即梦 API client
export {
  JimengClient,
  getJimengClient,
  generateImage,
  generateCharacterImage,
  generateSceneImage,
  generateSceneReferenceImage,
} from "./jimeng";

// Prompt builders and parsers
export {
  buildOutlinePrompt,
  parseOutlineResponse,
  buildScriptPrompt,
  parseScriptResponse,
  buildSceneScriptPrompt,
  parseSceneScriptResponse,
  cleanResponseText,
} from "./prompts";

// Re-export types
export type {
  PoeMessage,
  PoeChatRequest,
  PoeChatResponse,
  PoeError,
  RetryConfig,
  AIModelConfig,
  PoeModel,
  OutlineGenerationInput,
  OutlineGenerationOutput,
  CharacterOutline,
  WorldSceneOutline,
  EpisodeOutline,
  ScriptGenerationInput,
  ScriptGenerationOutput,
  SceneScriptGenerationInput,
  SceneScriptGenerationOutput,
  SceneScriptItem,
  // 火山引擎即梦 API types
  JimengModel,
  ImageGenerationStatus,
  JimengSubmitTaskRequest,
  JimengSubmitTaskResponse,
  JimengGetResultRequest,
  JimengGetResultResponse,
  CharacterImageGenerationInput,
  CharacterImageGenerationResult,
  SceneImageGenerationInput,
  SceneImageGenerationResult,
  SceneReferenceImageInput,
  SceneReferenceImageResult,
  CharacterViewType,
  JimengConfig,
  JimengRetryConfig,
} from "@/types/ai";