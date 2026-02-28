/**
 * 火山引擎即梦 API 客户端
 * 实现图片生成功能，支持 AWS Signature V4 签名
 * 文档: https://www.volcengine.com/docs/85621/1817045
 */

import { createHmac, createHash } from "crypto";
import type {
  JimengConfig,
  JimengModel,
  JimengRetryConfig,
  JimengSubmitTaskRequest,
  JimengSubmitTaskResponse,
  JimengGetResultRequest,
  JimengGetResultResponse,
  ImageGenerationStatus,
  CharacterImageGenerationInput,
  CharacterImageGenerationResult,
  SceneImageGenerationInput,
  SceneImageGenerationResult,
  SceneReferenceImageInput,
  SceneReferenceImageResult,
  CharacterViewType,
} from "@/types/ai";

// 默认配置
const DEFAULT_MODEL: JimengModel = "jimeng_t2i_v40";
const DEFAULT_REGION = "cn-north-1";
const DEFAULT_HOST = "visual.volcengineapi.com";
const DEFAULT_ENDPOINT = "https://visual.volcengineapi.com";
const SERVICE = "cv";

// 默认重试配置
const DEFAULT_RETRY_CONFIG: JimengRetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableErrors: ["rate_limit", "timeout", "server_error", "overloaded"],
  pollingInterval: 5000, // 5秒轮询一次
  maxPollingAttempts: 60, // 最多轮询60次（5分钟）
};

/**
 * 火山引擎即梦 API 客户端类
 */
export class JimengClient {
  private accessKey: string;
  private secretKey: string;
  private region: string;
  private host: string;
  private endpoint: string;
  private retryConfig: JimengRetryConfig;

  constructor(config?: Partial<JimengConfig>) {
    this.accessKey = config?.accessKey || process.env.VOLCENGINE_ACCESS_KEY || "";
    this.secretKey = config?.secretKey || process.env.VOLCENGINE_SECRET_KEY || "";
    this.region = config?.region || DEFAULT_REGION;
    this.host = config?.host || DEFAULT_HOST;
    this.endpoint = config?.endpoint || DEFAULT_ENDPOINT;
    this.retryConfig = DEFAULT_RETRY_CONFIG;

    if (!this.accessKey || !this.secretKey) {
      throw new Error("VOLCENGINE_ACCESS_KEY and VOLCENGINE_SECRET_KEY are required");
    }
  }

  /**
   * 提交图片生成任务
   */
  async submitTask(
    prompt: string,
    options?: {
      imageUrls?: string[];
      scale?: number;
      width?: number;
      height?: number;
    }
  ): Promise<string> {
    const body: JimengSubmitTaskRequest = {
      req_key: DEFAULT_MODEL,
      prompt,
      image_urls: options?.imageUrls || [],
      scale: options?.scale ?? 0.5,
      width: options?.width,
      height: options?.height,
    };

    const queryParams = {
      Action: "CVSync2AsyncSubmitTask",
      Version: "2022-08-31",
    };

    const response = await this.makeRequest<JimengSubmitTaskResponse>(
      queryParams,
      body
    );

    if (response.code !== 10000) {
      throw new Error(`即梦 API 提交任务失败: ${response.message} (code: ${response.code})`);
    }

    return response.data.task_id;
  }

  /**
   * 查询任务结果
   */
  async getResult(taskId: string): Promise<{
    status: ImageGenerationStatus;
    imageUrl?: string;
    error?: string;
  }> {
    const body: JimengGetResultRequest = {
      req_key: DEFAULT_MODEL,
      task_id: taskId,
      req_json: JSON.stringify({
        logo_info: { add_logo: false },
        return_url: true,
      }),
    };

    const queryParams = {
      Action: "CVSync2AsyncGetResult",
      Version: "2022-08-31",
    };

    const response = await this.makeRequest<JimengGetResultResponse>(
      queryParams,
      body
    );

    if (response.code !== 10000) {
      return {
        status: "failed",
        error: response.message,
      };
    }

    const { status, image_urls } = response.data;

    if (status === "done" && image_urls && image_urls.length > 0) {
      return {
        status: "done",
        imageUrl: image_urls[0],
      };
    }

    if (status === "in_queue" || status === "generating") {
      return { status };
    }

    return {
      status: "failed",
      error: `未知状态: ${status}`,
    };
  }

  /**
   * 提交任务并等待结果
   */
  async generateImage(
    prompt: string,
    options?: {
      imageUrls?: string[];
      scale?: number;
      width?: number;
      height?: number;
    }
  ): Promise<{ imageUrl: string; taskId: string }> {
    // 提交任务
    const taskId = await this.submitTask(prompt, options);

    // 轮询等待结果
    for (let attempt = 0; attempt < this.retryConfig.maxPollingAttempts; attempt++) {
      await this.sleep(this.retryConfig.pollingInterval);

      const result = await this.getResult(taskId);

      if (result.status === "done" && result.imageUrl) {
        return { imageUrl: result.imageUrl, taskId };
      }

      if (result.status === "failed") {
        throw new Error(`图片生成失败: ${result.error}`);
      }

      // 继续等待
    }

    throw new Error(`图片生成超时 (taskId: ${taskId})`);
  }

  /**
   * 生成角色三视图
   */
  async generateCharacterImage(
    input: CharacterImageGenerationInput
  ): Promise<CharacterImageGenerationResult> {
    const viewPromptMap: Record<CharacterViewType, string> = {
      front: "正面视图",
      side: "侧面视图",
      back: "背面视图",
    };

    const prompt = this.buildCharacterPrompt(input, viewPromptMap[input.viewType]);

    try {
      const result = await this.generateImage(prompt, { scale: 0.6 });
      return {
        taskId: result.taskId,
        status: "done",
        imageUrl: result.imageUrl,
      };
    } catch (error) {
      return {
        taskId: "",
        status: "failed",
        error: (error as Error).message,
      };
    }
  }

  /**
   * 生成场景图
   */
  async generateSceneImage(
    input: SceneImageGenerationInput
  ): Promise<SceneImageGenerationResult> {
    const prompt = this.buildScenePrompt(input);

    try {
      const result = await this.generateImage(prompt, { scale: 0.5 });
      return {
        taskId: result.taskId,
        status: "done",
        imageUrl: result.imageUrl,
      };
    } catch (error) {
      return {
        taskId: "",
        status: "failed",
        error: (error as Error).message,
      };
    }
  }

  /**
   * 生成分镜参考图
   */
  async generateSceneReferenceImage(
    input: SceneReferenceImageInput
  ): Promise<SceneReferenceImageResult> {
    const prompt = this.buildSceneReferencePrompt(input);

    try {
      const options = input.referenceImageUrl
        ? { imageUrls: [input.referenceImageUrl], scale: 0.5 }
        : { scale: 0.5 };

      const result = await this.generateImage(prompt, options);
      return {
        taskId: result.taskId,
        status: "done",
        imageUrl: result.imageUrl,
      };
    } catch (error) {
      return {
        taskId: "",
        status: "failed",
        error: (error as Error).message,
      };
    }
  }

  /**
   * 构建角色图片 Prompt
   */
  private buildCharacterPrompt(
    input: CharacterImageGenerationInput,
    viewDescription: string
  ): string {
    return [
      input.artStyle,
      "风格",
      "角色设定图",
      viewDescription,
      `角色名称: ${input.characterName}`,
      `外貌: ${input.appearance}`,
      `性格: ${input.personality}`,
      "高质量角色设计图",
      "清晰完整",
      "无背景",
    ].join(", ");
  }

  /**
   * 构建场景图片 Prompt
   */
  private buildScenePrompt(input: SceneImageGenerationInput): string {
    return [
      input.artStyle,
      "风格",
      "场景概念图",
      `场景: ${input.sceneName}`,
      `描述: ${input.description}`,
      `氛围: ${input.atmosphere}`,
      "高质量场景设计",
      "细节丰富",
    ].join(", ");
  }

  /**
   * 构建分镜参考图 Prompt
   */
  private buildSceneReferencePrompt(input: SceneReferenceImageInput): string {
    return [
      input.artStyle,
      "风格",
      "电影分镜",
      `场景: ${input.sceneDescription}`,
      `人物: ${input.characterDescription}`,
      `动作: ${input.actionDescription}`,
      "高质量分镜图",
      "电影级构图",
    ].join(", ");
  }

  /**
   * 发送请求（带重试）
   */
  private async makeRequest<T>(
    queryParams: Record<string, string>,
    body: object
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.makeSingleRequest<T>(queryParams, body);
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryableError(error)) {
          throw error;
        }

        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.warn(
            `即梦 API 请求失败 (尝试 ${attempt + 1}/${this.retryConfig.maxRetries + 1}), ${delay}ms 后重试...`
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error("超过最大重试次数");
  }

  /**
   * 发送单次请求
   */
  private async makeSingleRequest<T>(
    queryParams: Record<string, string>,
    body: object
  ): Promise<T> {
    const requestBody = JSON.stringify(body);
    const queryString = this.formatQuery(queryParams);
    const url = `${this.endpoint}?${queryString}`;

    // 生成 AWS Signature V4 签名
    const headers = this.signRequest(queryString, requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: requestBody,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`即梦 API 请求失败: ${JSON.stringify(data)}`);
    }

    return data as T;
  }

  /**
   * AWS Signature V4 签名
   */
  private signRequest(
    queryString: string,
    requestBody: string
  ): Record<string, string> {
    const now = new Date();
    const currentDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = currentDate.slice(0, 8);

    // 计算 payload hash
    const payloadHash = createHash("sha256").update(requestBody).digest("hex");

    // 构建规范化请求
    const canonicalHeaders = [
      `content-type:application/json`,
      `host:${this.host}`,
      `x-content-sha256:${payloadHash}`,
      `x-date:${currentDate}`,
    ].join("\n") + "\n";

    const signedHeaders = "content-type;host;x-content-sha256;x-date";

    const canonicalRequest = [
      "POST",
      "/",
      queryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    // 构建待签名字符串
    const credentialScope = `${dateStamp}/${this.region}/${SERVICE}/request`;
    const stringToSign = [
      "HMAC-SHA256",
      currentDate,
      credentialScope,
      createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");

    // 计算签名
    const signingKey = this.getSignatureKey(dateStamp);
    const signature = createHmac("sha256", signingKey)
      .update(stringToSign)
      .digest("hex");

    // 构建 Authorization header
    const authorization = [
      `HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(", ");

    return {
      "X-Date": currentDate,
      Authorization: authorization,
      "X-Content-Sha256": payloadHash,
      "Content-Type": "application/json",
    };
  }

  /**
   * 获取签名密钥
   */
  private getSignatureKey(dateStamp: string): Buffer {
    const kDate = createHmac("sha256", this.secretKey).update(dateStamp).digest();
    const kRegion = createHmac("sha256", kDate).update(this.region).digest();
    const kService = createHmac("sha256", kRegion).update(SERVICE).digest();
    const kSigning = createHmac("sha256", kService).update("request").digest();
    return kSigning;
  }

  /**
   * 格式化查询参数
   */
  private formatQuery(params: Record<string, string>): string {
    return Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
  }

  /**
   * 检查是否可重试错误
   */
  private isRetryableError(error: unknown): boolean {
    const message = (error as Error)?.message?.toLowerCase() || "";
    const retryablePatterns = [
      "rate_limit",
      "rate limit",
      "too many requests",
      "timeout",
      "server_error",
      "internal server error",
      "overloaded",
      "service unavailable",
      "503",
      "429",
      "500",
    ];

    return retryablePatterns.some((pattern) => message.includes(pattern));
  }

  /**
   * 计算重试延迟（指数退避）
   */
  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    // 添加抖动 (±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * 睡眠工具
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 单例实例
let jimengClient: JimengClient | null = null;

/**
 * 获取即梦客户端实例
 */
export function getJimengClient(): JimengClient {
  if (!jimengClient) {
    jimengClient = new JimengClient();
  }
  return jimengClient;
}

/**
 * 生成图片简单封装
 */
export async function generateImage(
  prompt: string,
  options?: {
    imageUrls?: string[];
    scale?: number;
  }
): Promise<{ imageUrl: string; taskId: string }> {
  const client = getJimengClient();
  return client.generateImage(prompt, options);
}

/**
 * 生成角色图片
 */
export async function generateCharacterImage(
  input: CharacterImageGenerationInput
): Promise<CharacterImageGenerationResult> {
  const client = getJimengClient();
  return client.generateCharacterImage(input);
}

/**
 * 生成场景图片
 */
export async function generateSceneImage(
  input: SceneImageGenerationInput
): Promise<SceneImageGenerationResult> {
  const client = getJimengClient();
  return client.generateSceneImage(input);
}

/**
 * 生成分镜参考图
 */
export async function generateSceneReferenceImage(
  input: SceneReferenceImageInput
): Promise<SceneReferenceImageResult> {
  const client = getJimengClient();
  return client.generateSceneReferenceImage(input);
}