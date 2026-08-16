import type {
  AIVideoProvider,
  VideoGenerationParams,
  VideoTaskResponse,
} from "../types";
import { getProviderModelId } from "../model-mapping";

type AutoDLResult = {
  url?: string;
  type?: string;
  file_type?: string;
};

type AutoDLResponse = {
  code?: string;
  msg?: string;
  data?: {
    status?: string;
    results?: AutoDLResult[];
    task_id?: string;
  };
  task_id?: string;
  status?: string;
  results?: AutoDLResult[];
};

const BASE_URL = "https://autodl.art/api/v1/comfyui/comfyui_workflow";

export class AutoDLProvider implements AIVideoProvider {
  name = "autodl";
  supportImageToVideo = true;

  constructor(private readonly apiKey: string) {}

  async createTask(params: VideoGenerationParams): Promise<VideoTaskResponse> {
    const model = params.model || "h3-text-to-video";
    const workflowId = getProviderModelId(model, "autodl");
    const response = await fetch(`${BASE_URL}/${workflowId}`, {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.toRequestBody(params)),
    });

    const data = await this.readResponse(response);
    const taskId = data.data?.task_id || data.task_id;
    if (!taskId) {
      throw new Error(data.msg || "AutoDL did not return a task ID");
    }

    return this.toTaskResponse(data, taskId);
  }

  async getTaskStatus(taskId: string): Promise<VideoTaskResponse> {
    const response = await fetch(`${BASE_URL}/result/${taskId}`, {
      method: "POST",
      headers: { Authorization: this.apiKey },
    });
    const data = await this.readResponse(response);
    return this.toTaskResponse(data, taskId);
  }

  parseCallback(payload: AutoDLResponse): VideoTaskResponse {
    const taskId = payload.data?.task_id || payload.task_id || "";
    return this.toTaskResponse(payload, taskId);
  }

  private async readResponse(response: Response): Promise<AutoDLResponse> {
    let data: AutoDLResponse;
    try {
      data = (await response.json()) as AutoDLResponse;
    } catch {
      throw new Error(`AutoDL API error: ${response.status}`);
    }

    if (!response.ok || (data.code && data.code.toLowerCase() !== "success")) {
      throw new Error(data.msg || `AutoDL API error: ${response.status}`);
    }
    return data;
  }

  private toTaskResponse(data: AutoDLResponse, taskId: string): VideoTaskResponse {
    const status = data.data?.status || data.status || "queued";
    const results = data.data?.results || data.results || [];
    const videoUrl = results.find((result) => result.type === "video")?.url || results[0]?.url;

    return {
      taskId,
      provider: "autodl",
      status: this.mapStatus(status),
      videoUrl,
      raw: data,
    };
  }

  private toRequestBody(params: VideoGenerationParams): Record<string, string> {
    const body: Record<string, string> = {
      prompt: params.prompt,
      duration: String(params.duration || 5),
      resolution: this.resolveResolution(params),
    };
    const images = params.imageUrls?.length
      ? params.imageUrls
      : params.imageUrl
        ? [params.imageUrl]
        : [];

    if (params.mode === "reference-to-video") {
      images.slice(0, 9).forEach((url, index) => {
        body[`ref_image_${index}`] = url;
      });
    } else if (params.mode === "frames-to-video") {
      if (images[0]) body.first_frame = images[0];
      if (images[1]) body.last_frame = images[1];
    }

    return body;
  }

  private resolveResolution(params: VideoGenerationParams): string {
    const requested = params.resolution || params.quality || "768p";
    const value = requested.toLowerCase();
    const size = value.includes("1080") ? "1080p" : value.includes("480") ? "480p" : "768p";
    const portrait = value.includes("竖") || value.includes("portrait") || params.aspectRatio === "9:16";
    return `${size}${portrait ? "竖" : "横"}`;
  }

  private mapStatus(status: string): VideoTaskResponse["status"] {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
        return "completed";
      case "failed":
      case "error":
      case "cancelled":
        return "failed";
      case "running":
      case "processing":
        return "processing";
      default:
        return "pending";
    }
  }
}
