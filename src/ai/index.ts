import type { AIVideoProvider, ProviderType } from "./types";
import { AutoDLProvider } from "./providers/autodl";
import {
  getConfiguredAIProvider,
  requireProviderApiKey,
} from "./provider-config";

const providers: Map<ProviderType, AIVideoProvider> = new Map();

export function getProvider(type: ProviderType): AIVideoProvider {
  if (providers.has(type)) return providers.get(type)!;

  let provider: AIVideoProvider;
  switch (type) {
    case "autodl":
      provider = new AutoDLProvider(requireProviderApiKey("autodl"));
      break;
    default:
      throw new Error(`Unknown provider: ${type}`);
  }

  providers.set(type, provider);
  return provider;
}

export function getDefaultProvider(): AIVideoProvider {
  const type = getConfiguredAIProvider() || "autodl";
  return getProvider(type);
}

export * from "./types";
export * from "./provider-config";
