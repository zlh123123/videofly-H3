"use client";

/**
 * Generator Panel Component - Pollo.ai Style
 *
 * Tool page generator panel with dark theme design
 * Design inspired by https://pollo.ai
 * - Dark theme (#1A1A1A background)
 * - Uppercase labels for sections
 * - Purple accent color (#6D28D9)
 * - Dashed border upload area
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui";
import { DEFAULT_VIDEO_MODELS } from "@/components/video-generator";
import { getAvailableModels, calculateModelCredits } from "@/config/credits";
import { X, Sparkles, Image as ImageIcon } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface SectionLabelProps {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

function SectionLabel({ children, required, className }: SectionLabelProps) {
  return (
    <div className={cn("text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 block", className)}>
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </div>
  );
}

interface GeneratorPanelProps {
  toolType: "image-to-video" | "text-to-video" | "reference-to-video" | "frames-to-video";
  isLoading?: boolean;
  onSubmit?: (data: GeneratorData) => void;
  availableModelIds?: string[];
  defaultModelId?: string;
  initialPrompt?: string;
  initialModelId?: string;
  initialDuration?: number;
  initialAspectRatio?: string;
  initialQuality?: string;
  initialImageUrl?: string;
}

export interface GeneratorData {
  toolType: string;
  model: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  quality?: string;
  outputNumber?: number;
  generateAudio?: boolean;
  imageFiles?: File[];
  imageUrls?: string[];
  estimatedCredits: number;
}

export function GeneratorPanel({
  toolType,
  isLoading = false,
  onSubmit,
  availableModelIds,
  defaultModelId,
  initialPrompt,
  initialModelId,
  initialDuration,
  initialAspectRatio,
  initialQuality,
  initialImageUrl,
}: GeneratorPanelProps) {
  const t = useTranslations("GeneratorPanel");
  const models = getAvailableModels();
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [selectedModel, setSelectedModel] = useState(initialModelId || defaultModelId || models[0]?.id || "");
  const [duration, setDuration] = useState(initialDuration || 10);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio || "16:9");
  const [quality, setQuality] = useState(initialQuality || "standard");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrl ? [initialImageUrl] : []);

  // Filter models based on tool type
  const availableModels = useMemo(() => {
    const allowList = Array.isArray(availableModelIds) && availableModelIds.length > 0;
    let filtered = allowList
      ? models.filter((m) => availableModelIds!.includes(m.id))
      : models;
    if (toolType !== "text-to-video") {
      filtered = filtered.filter((m) => m.supportImageToVideo);
    }
    return filtered;
  }, [toolType, models, availableModelIds]);

  const currentModel = useMemo(
    () => availableModels.find((m) => m.id === selectedModel) || availableModels[0],
    [selectedModel, availableModels]
  );
  const hasAvailableModels = availableModels.length > 0;

  const modelMetadata = useMemo(() => {
    return new Map(DEFAULT_VIDEO_MODELS.map((model) => [model.id, model]));
  }, []);

  const getModelIcon = (modelId: string, fallbackName: string) => {
    const meta = modelMetadata.get(modelId);
    return meta?.icon ?? fallbackName.charAt(0).toUpperCase();
  };

  const getModelColor = (modelId: string) => {
    const meta = modelMetadata.get(modelId);
    return meta?.color ?? "#71717a";
  };

  const renderModelIcon = (modelId: string, name: string, size: "sm" | "md" = "sm") => {
    const icon = getModelIcon(modelId, name);
    const color = getModelColor(modelId);
    const sizeClass = size === "sm" ? "w-4 h-4 text-xs" : "w-6 h-6 text-xs";

    if (typeof icon === "string" && (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/"))) {
      return (
        <img
          src={icon}
          alt={name}
          className={cn(sizeClass, "rounded object-cover")}
        />
      );
    }

    return (
      <span
        className={cn(sizeClass, "rounded flex items-center justify-center font-bold")}
        style={{ backgroundColor: color, color: "#fff" }}
      >
        {typeof icon === "string" ? icon : name.charAt(0).toUpperCase()}
      </span>
    );
  };

  useEffect(() => {
    if (!currentModel) return;

    if (currentModel.durations && !currentModel.durations.includes(duration)) {
      setDuration(currentModel.durations[0] || duration);
    }

    if (currentModel.aspectRatios && !currentModel.aspectRatios.includes(aspectRatio)) {
      setAspectRatio(currentModel.aspectRatios[0] || aspectRatio);
    }

    if (currentModel.qualities) {
      if (!currentModel.qualities.includes(quality)) {
        setQuality(currentModel.qualities[0] || quality);
      }
    }
  }, [currentModel, duration, aspectRatio, quality]);

  useEffect(() => {
    if (!availableModels.length) return;
    if (selectedModel && availableModels.some((m) => m.id === selectedModel)) {
      return;
    }
    const fallback = defaultModelId && availableModels.some((m) => m.id === defaultModelId)
      ? defaultModelId
      : availableModels[0]?.id;
    if (fallback) {
      setSelectedModel(fallback);
    }
  }, [availableModels, selectedModel, defaultModelId]);

  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
    if (initialImageUrl && imageFiles.length === 0 && imageUrls.length === 0) {
      setImageUrls([initialImageUrl]);
    }
  }, [initialPrompt, initialImageUrl, prompt, imageFiles.length, imageUrls.length]);

  useEffect(() => {
    if (!currentModel) return;
    if (initialDuration && currentModel.durations?.includes(initialDuration)) {
      setDuration(initialDuration);
    }
    if (initialAspectRatio && currentModel.aspectRatios?.includes(initialAspectRatio)) {
      setAspectRatio(initialAspectRatio);
    }
    if (initialQuality && currentModel.qualities?.includes(initialQuality)) {
      setQuality(initialQuality);
    }
  }, [currentModel, initialDuration, initialAspectRatio, initialQuality]);

  const estimatedCredits = useMemo(() => {
    if (!selectedModel) return 0;
    return calculateModelCredits(selectedModel, {
      duration,
      quality: currentModel?.qualities?.includes(quality) ? quality : undefined,
    });
  }, [selectedModel, duration, quality, currentModel]);

  const handleSubmit = useCallback(() => {
    if (!currentModel) return;
    const hasPrompt = prompt.trim().length > 0;
    const requiresImage = toolType !== "text-to-video";
    const imageCount = imageFiles.length + imageUrls.length;
    const hasRequiredImages = toolType === "frames-to-video" ? imageCount === 2 : imageCount > 0;
    if (!hasPrompt || isLoading) return;
    if (requiresImage && !hasRequiredImages) return;

    const data: GeneratorData = {
      toolType,
      model: selectedModel,
      prompt: prompt.trim(),
      duration,
      aspectRatio,
      quality: currentModel?.qualities?.includes(quality) ? quality : undefined,
      outputNumber: 1,
      imageFiles: imageFiles.length ? imageFiles : undefined,
      imageUrls: imageUrls.length ? imageUrls : undefined,
      estimatedCredits,
    };

    onSubmit?.(data);
  }, [
    prompt,
    selectedModel,
    duration,
    aspectRatio,
    quality,
    imageFiles,
    imageUrls,
    estimatedCredits,
    isLoading,
    toolType,
    onSubmit,
    currentModel,
  ]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxImages = toolType === "reference-to-video" ? 9 : 2;
    setImageFiles((current) => [...current, ...files].slice(0, maxImages));
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    if (index < imageFiles.length) {
      setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
      return;
    }
    const urlIndex = index - imageFiles.length;
    setImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== urlIndex));
  };

  const imageCount = imageFiles.length + imageUrls.length;
  const requiredImageCount = toolType === "frames-to-video" ? 2 : 1;
  const maxImages = toolType === "reference-to-video" ? 9 : 2;

  const canSubmit = hasAvailableModels &&
    Boolean(currentModel) &&
    prompt.trim().length > 0 &&
    (toolType === "text-to-video" || imageCount >= requiredImageCount) &&
    !isLoading;


  // Get page title
  const getPageTitle = () => {
    if (toolType === "image-to-video") return t("titles.imageToVideo");
    if (toolType === "text-to-video") return t("titles.textToVideo");
    if (toolType === "frames-to-video") return t("titles.imageToVideo");
    if (toolType === "reference-to-video") return t("titles.referenceToVideo");
    return t("titles.generator");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main Card - Pollo.ai Style */}
      <div className="flex-1 flex flex-col rounded-xl bg-card border border-border overflow-hidden text-foreground">
        {/* Header Bar */}
        <div className="px-5 py-3 bg-muted/40 border-b border-border shrink-0">
          <h2 className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            {getPageTitle()}
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {!hasAvailableModels && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t("noModels")}
            </div>
          )}

          {hasAvailableModels && (
            <>
          {/* Model Selection */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {t("model")}
            </span>
            {currentModel && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-sm text-white">
                {renderModelIcon(currentModel.id, currentModel.name, "sm")}
                <span>{currentModel.name}</span>
              </div>
            )}
          </div>

          {/* Prompt Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel className="mb-0">{t("prompt")}</SectionLabel>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("promptPlaceholder")}
              disabled={isLoading}
              className="w-full min-h-[100px] max-h-[200px] px-4 py-3 rounded-lg bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/70 resize-none focus:outline-none focus:border-primary transition-colors text-sm leading-relaxed"
              rows={4}
              maxLength={2000}
            />
          </div>

          {/* Reference image upload */}
          {toolType !== "text-to-video" &&
            currentModel?.supportImageToVideo && (
              <div>
                <SectionLabel required>
                  {toolType === "frames-to-video" ? t("referenceImage") : t("imageSource")}
                </SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  {imageFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="relative group h-28 rounded-lg overflow-hidden border-2 border-zinc-700">
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <span className="text-xs font-medium truncate bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">{file.name}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-2 right-2 p-1.5 rounded-full bg-muted/80 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5 text-foreground" />
                      </button>
                    </div>
                  ))}
                  {imageUrls.map((url, urlIndex) => {
                    const index = imageFiles.length + urlIndex;
                    return (
                      <div key={url} className="relative group h-28 rounded-lg overflow-hidden border-2 border-zinc-700">
                        <img src={url} alt={t("selectedImage")} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-2 right-2 p-1.5 rounded-full bg-muted/80 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3.5 h-3.5 text-foreground" />
                        </button>
                      </div>
                    );
                  })}
                  {imageCount < maxImages && (
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted/60 group-hover:bg-muted transition-colors">
                      <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{t("uploadImage")}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{t("imageFormats")}</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple={maxImages > 1}
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                  )}
                </div>
              </div>
            )}


          {/* Settings Group */}
          <div className="space-y-5">
            {/* Aspect Ratio */}
            {currentModel?.aspectRatios && (
              <div>
                <SectionLabel>{t("aspectRatio")}</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                  {currentModel.aspectRatios.map((ar) => (
                    <button
                      key={ar}
                      type="button"
                      onClick={() => setAspectRatio(ar)}
                      disabled={isLoading}
                      className={cn(
                        "aspect-square w-full rounded-lg text-xs font-medium transition-all border flex items-center justify-center",
                        aspectRatio === ar
                          ? "bg-primary/10 text-foreground border-primary"
                          : "bg-muted/40 text-muted-foreground border-border hover:border-muted-foreground/40"
                      )}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "border-2 rounded-sm",
                          aspectRatio === ar ? "border-primary" : "border-muted-foreground/50",
                          ar === "16:9" && "w-8 h-4",
                          ar === "9:16" && "w-4 h-8",
                          ar === "1:1" && "w-6 h-6",
                          ar === "4:3" && "w-6 h-4",
                          ar === "3:4" && "w-4 h-6"
                        )} />
                        <span>{ar}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Duration & Quality */}
            <div className="grid grid-cols-2 gap-4">
              {currentModel?.durations && (
                <div>
                  <SectionLabel>{t("videoLength")}</SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {currentModel.durations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        disabled={isLoading}
                        className={cn(
                          "h-10 rounded-lg text-sm font-medium transition-all",
                          duration === d
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentModel?.qualities && (
                <div>
                  <SectionLabel>{t("resolution")}</SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {currentModel.qualities.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuality(q)}
                        disabled={isLoading}
                        className={cn(
                          "h-10 rounded-lg text-sm font-medium transition-all capitalize",
                          quality === q
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>

        {/* Bottom Section - Credits + Generate Button */}
        <div className="px-5 py-4 bg-muted/40 border-t border-border space-y-4 shrink-0">
          {/* Credits Display */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t("totalCredits")}</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <span className="text-foreground font-medium">{estimatedCredits} {t("credits")}</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              canSubmit
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t("generate")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
