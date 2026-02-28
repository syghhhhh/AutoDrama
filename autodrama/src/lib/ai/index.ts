/**
 * AI module exports
 */

// Poe API client
export { PoeClient, getPoeClient, chatCompletion } from "./poe";

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
} from "@/types/ai";