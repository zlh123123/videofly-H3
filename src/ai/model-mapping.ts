import type { ProviderType } from "./types";

export type GenerationMode = "text-to-video" | "image-to-video" | "reference-to-video" | "frames-to-video";

export interface ProviderModelConfig { providerModelId: string; supported: boolean; }
export interface ModelMapping {
  internalId: string;
  displayName: string;
  providers: Partial<Record<ProviderType, ProviderModelConfig>>;
}

export const MODEL_MAPPINGS: Record<string, ModelMapping> = {
  "h3-text-to-video": {
    internalId: "h3-text-to-video",
    displayName: "H3 文生视频",
    providers: { autodl: { providerModelId: "minimax_h3_lightx2v_no_pic", supported: true } },
  },
  "h3-reference-to-video": {
    internalId: "h3-reference-to-video",
    displayName: "H3 多参考图生成视频",
    providers: { autodl: { providerModelId: "minimax_h3_lightx2v_v5", supported: true } },
  },
  "h3-frames-to-video": {
    internalId: "h3-frames-to-video",
    displayName: "H3 首帧参考生成视频",
    providers: { autodl: { providerModelId: "minimax_h3_lightx2v", supported: true } },
  },
};

const MODEL_MODE_SUPPORT: Record<string, Partial<Record<ProviderType, GenerationMode[]>>> = {
  "h3-text-to-video": { autodl: ["text-to-video"] },
  "h3-reference-to-video": { autodl: ["reference-to-video"] },
  "h3-frames-to-video": { autodl: ["frames-to-video"] },
};

export function getProviderModelId(internalModelId: string, provider: ProviderType): string {
  const config = MODEL_MAPPINGS[internalModelId]?.providers[provider];
  if (!config?.supported) throw new Error(`Model ${internalModelId} is not supported by provider ${provider}`);
  return config.providerModelId;
}

export function isModelSupported(internalModelId: string, provider: ProviderType): boolean {
  return MODEL_MAPPINGS[internalModelId]?.providers[provider]?.supported ?? false;
}

export function normalizeGenerationMode(mode?: string, hasImageInput = false): GenerationMode {
  switch (mode) {
    case "reference-to-video":
    case "frames-to-video":
    case "image-to-video":
      return mode;
    case "text-image-to-video":
    case "text-to-video":
      return hasImageInput ? "image-to-video" : "text-to-video";
    default:
      return hasImageInput ? "image-to-video" : "text-to-video";
  }
}

export function isModelModeSupported(internalModelId: string, provider: ProviderType, mode: GenerationMode): boolean {
  return MODEL_MODE_SUPPORT[internalModelId]?.[provider]?.includes(mode) ?? false;
}

export function getSupportedModels(provider: ProviderType): string[] {
  return Object.values(MODEL_MAPPINGS)
    .filter((mapping) => mapping.providers[provider]?.supported)
    .map((mapping) => mapping.internalId);
}
