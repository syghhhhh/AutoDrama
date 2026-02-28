/**
 * Prompt templates for AI generation.
 * Used with Poe API for outline, script, and scene script generation.
 */

import type {
  OutlineGenerationInput,
  OutlineGenerationOutput,
  ScriptGenerationInput,
  SceneScriptGenerationInput,
  SceneScriptGenerationOutput,
  CharacterOutline,
  WorldSceneOutline,
  EpisodeOutline,
  SceneScriptItem,
} from "@/types/ai";
import type { PoeMessage } from "@/types/ai";

// ============================================
// Outline Generation Prompt
// ============================================

/**
 * Generate a series outline with characters, scenes, and episode outlines
 */
export function buildOutlinePrompt(input: OutlineGenerationInput): PoeMessage[] {
  const systemPrompt = `你是一位专业的短剧编剧和策划师。你的任务是根据用户提供的信息，为短剧系列创建完整的大纲。

你需要输出以下内容：
1. 系列大纲内容（一个完整的故事概述，包含世界观、主线剧情、核心冲突等）
2. 角色设定（主角、配角、反派等）
3. 世界场景设定（故事发生的主要场景）
4. 剧集规划（每集的标题和梗概）

请以 JSON 格式输出，格式如下：
{
  "content": "系列大纲内容...",
  "characters": [
    {
      "name": "角色名",
      "role": "protagonist/supporting/minor/antagonist",
      "appearance": "外貌描述",
      "personality": "性格描述",
      "background": "背景故事"
    }
  ],
  "world_scenes": [
    {
      "name": "场景名",
      "description": "场景描述",
      "atmosphere": "氛围描述"
    }
  ],
  "episode_outlines": [
    {
      "episode_number": 1,
      "title": "第一集标题",
      "synopsis": "第一集梗概"
    }
  ]
}

重要：
- 只输出 JSON，不要有其他内容
- 角色类型必须是: protagonist（主角）、supporting（配角）、minor（小角色）、antagonist（反派）之一
- 角色数量建议 3-8 个主要角色
- 场景数量建议 3-10 个主要场景
- 剧集数量要与用户要求的总集数一致`;

  const userPrompt = `请为以下短剧系列创建大纲：

系列标题：${input.seriesTitle}
${input.seriesDescription ? `系列简介：${input.seriesDescription}` : ""}
美术风格：${input.artStyle}
世界观设定：${input.worldSetting}
预计总集数：${input.totalEpisodes}

请生成完整的大纲、角色设定、场景设定和剧集规划。`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

/**
 * Parse outline generation response
 */
export function parseOutlineResponse(response: string): OutlineGenerationOutput {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return {
      content: parsed.content || "",
      characters: (parsed.characters || []).map(
        (c: Partial<CharacterOutline>) => ({
          name: c.name || "未命名角色",
          role: validateCharacterRole(c.role),
          appearance: c.appearance || "",
          personality: c.personality || "",
          background: c.background || "",
        })
      ),
      world_scenes: (parsed.world_scenes || []).map(
        (s: Partial<WorldSceneOutline>) => ({
          name: s.name || "未命名场景",
          description: s.description || "",
          atmosphere: s.atmosphere || "",
        })
      ),
      episode_outlines: (parsed.episode_outlines || []).map(
        (e: Partial<EpisodeOutline>) => ({
          episode_number: e.episode_number || 1,
          title: e.title || `第${e.episode_number || 1}集`,
          synopsis: e.synopsis || "",
        })
      ),
    };
  } catch (error) {
    console.error("Failed to parse outline response:", error);
    // Return empty but valid structure
    return {
      content: response,
      characters: [],
      world_scenes: [],
      episode_outlines: [],
    };
  }
}

function validateCharacterRole(
  role: string | undefined
): "protagonist" | "supporting" | "minor" | "antagonist" {
  const validRoles = ["protagonist", "supporting", "minor", "antagonist"];
  if (role && validRoles.includes(role)) {
    return role as "protagonist" | "supporting" | "minor" | "antagonist";
  }
  return "supporting";
}

// ============================================
// Script Generation Prompt
// ============================================

/**
 * Generate a script for a specific episode
 */
export function buildScriptPrompt(input: ScriptGenerationInput): PoeMessage[] {
  const systemPrompt = `你是一位专业的短剧编剧。你的任务是根据提供的大纲信息，为特定剧集编写剧本。

剧本要求：
1. 使用标准剧本格式，包含场景标题、角色名称、对话和动作描述
2. 对话要自然、生动，符合角色性格
3. 每集时长约 3-5 分钟（约 1500-2500 字）
4. 要有明确的情节发展和冲突
5. 结尾要有悬念或情感高潮

格式示例：
【场景：城市街道，日，外】

（镜头从天空俯视，慢慢下降到繁忙的街道）

李明（急匆匆地走在街上，神色焦虑）

李明：（自言自语）
如果今天找不到那份文件，一切就完了...

（一个陌生人突然撞到他）

请直接输出剧本内容，不要添加额外的解释或说明。`;

  const charactersInfo = input.characters
    .map((c) => `- ${c.name}（${c.role}）：${c.appearance}，性格：${c.personality}`)
    .join("\n");

  const scenesInfo = input.worldScenes
    .map((s) => `- ${s.name}：${s.description}（氛围：${s.atmosphere}）`)
    .join("\n");

  const userPrompt = `请为以下剧集编写剧本：

系列标题：${input.seriesTitle}
美术风格：${input.artStyle}
世界观：${input.worldSetting}

角色设定：
${charactersInfo}

可用场景：
${scenesInfo}

第 ${input.episodeNumber} 集：${input.episodeTitle}
梗概：${input.episodeSynopsis}

请编写完整的剧本。`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

/**
 * Parse script generation response
 */
export function parseScriptResponse(response: string): { content: string } {
  return {
    content: response,
  };
}

// ============================================
// Scene Script Generation Prompt
// ============================================

/**
 * Generate scene scripts from a script content
 */
export function buildSceneScriptPrompt(
  input: SceneScriptGenerationInput
): PoeMessage[] {
  const systemPrompt = `你是一位专业的分镜脚本师。你的任务是将剧本转换为详细的分镜脚本。

每个分镜脚本需要包含：
1. order_index: 分镜序号（从 1 开始）
2. scene_description: 场景描述（镜头看到的画面）
3. character_description: 角色描述（角色的表情、动作、位置等）
4. dialogue: 对话内容（如果有）
5. action_description: 动作描述（镜头运动、特效、转场等）
6. suggested_world_scene: 建议使用的世界场景名称（从提供的场景中选择）
7. suggested_characters: 建议出现的角色名称列表

请以 JSON 数组格式输出，格式如下：
[
  {
    "order_index": 1,
    "scene_description": "城市街道的全景，傍晚时分",
    "character_description": "李明站在路灯下，神情焦急",
    "dialogue": "李明：如果我找不到那份文件...",
    "action_description": "镜头从远景缓慢推进到中景",
    "suggested_world_scene": "城市街道",
    "suggested_characters": ["李明"]
  }
]

重要：
- 只输出 JSON 数组，不要有其他内容
- 每个分镜应该是一个完整的镜头
- 对话格式：角色名：对话内容
- 动作描述要具体，便于后期制作参考
- 分镜数量根据剧本内容合理安排，通常 10-30 个`;

  const charactersInfo = input.characters
    .map((c) => `- ${c.name}：${c.appearance}，${c.personality}`)
    .join("\n");

  const scenesInfo = input.worldScenes
    .map((s) => `- ${s.name}：${s.description}`)
    .join("\n");

  const userPrompt = `请将以下剧本转换为分镜脚本：

系列标题：${input.seriesTitle}
美术风格：${input.artStyle}

角色：
${charactersInfo}

可用场景：
${scenesInfo}

第 ${input.episodeNumber} 集剧本：
${input.scriptContent}

请生成分镜脚本。`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

/**
 * Parse scene script generation response
 */
export function parseSceneScriptResponse(
  response: string
): SceneScriptGenerationOutput {
  try {
    // Try to extract JSON array from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return {
      scenes: (parsed || []).map((s: Partial<SceneScriptItem>, index: number) => ({
        order_index: s.order_index ?? index + 1,
        scene_description: s.scene_description || "",
        character_description: s.character_description || "",
        dialogue: s.dialogue || "",
        action_description: s.action_description || "",
        suggested_world_scene: s.suggested_world_scene,
        suggested_characters: s.suggested_characters || [],
      })),
    };
  } catch (error) {
    console.error("Failed to parse scene script response:", error);
    // Return empty but valid structure
    return {
      scenes: [],
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Clean and normalize AI response text
 */
export function cleanResponseText(text: string): string {
  // Remove markdown code blocks if present
  return text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();
}