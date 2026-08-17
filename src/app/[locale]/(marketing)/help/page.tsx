import type { Locale } from "@/config/i18n-config";

interface HelpPageProps {
  params: Promise<{ locale: Locale }>;
}

const copy = {
  zh: {
    title: "使用帮助",
    intro: "选择对应的视频工具，按步骤填写内容即可开始生成。",
    tools: [
      {
        title: "文生视频",
        steps: ["输入视频提示词，描述主体、动作、场景和镜头。", "选择时长和输出分辨率。", "点击生成，等待视频完成后下载。"],
      },
      {
        title: "多参考图生成视频",
        steps: ["输入提示词，说明希望参考图如何出现在视频中。", "上传至少一张参考图片，最多支持九张。", "选择时长和分辨率后开始生成。"],
      },
      {
        title: "首尾帧生成视频",
        steps: ["输入描述首帧到尾帧之间动作变化的提示词。", "上传首帧和尾帧图片。", "选择时长和分辨率后开始生成。"],
      },
    ],
    tips: ["提示词越具体，生成结果越稳定。", "图片请使用清晰的 JPG、PNG 或 WebP 文件。", "生成过程中请不要重复提交同一个任务。"],
  },
  en: {
    title: "Help",
    intro: "Choose a video tool and follow its steps to start generating.",
    tools: [
      { title: "Text to Video", steps: ["Describe the subject, action, scene, and camera in your prompt.", "Choose the duration and output resolution.", "Generate and download the video when it is ready."] },
      { title: "Multi-reference Video", steps: ["Describe how the reference images should appear in the video.", "Upload one to nine reference images.", "Choose the duration and resolution, then generate."] },
      { title: "First and Last Frame", steps: ["Describe the motion between the first and last frame.", "Upload the first-frame and last-frame images.", "Choose the duration and resolution, then generate."] },
    ],
    tips: ["Specific prompts usually produce more consistent results.", "Use clear JPG, PNG, or WebP images.", "Avoid submitting the same task repeatedly while it is processing."],
  },
} as const;

export default async function HelpPage({ params }: HelpPageProps) {
  const { locale } = await params;
  const content = copy[locale === "zh" ? "zh" : "en"];

  return (
    <div className="border-t border-border/60 bg-muted/20">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-10 md:py-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <p className="mb-4 text-sm font-semibold text-foreground">
            {locale === "zh" ? "文档目录" : "Documentation"}
          </p>
          <nav aria-label={locale === "zh" ? "帮助目录" : "Help sections"}>
            <ul className="space-y-1 border-l border-border pl-4 text-sm">
              <li>
                <a className="block py-1.5 text-muted-foreground transition-colors hover:text-foreground" href="#overview">
                  {content.title}
                </a>
              </li>
              {content.tools.map((tool, index) => (
                <li key={tool.title}>
                  <a className="block py-1.5 text-muted-foreground transition-colors hover:text-foreground" href={`#tool-${index + 1}`}>
                    {tool.title}
                  </a>
                </li>
              ))}
              <li>
                <a className="block py-1.5 text-muted-foreground transition-colors hover:text-foreground" href="#tips">
                  {locale === "zh" ? "使用建议" : "Tips"}
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="min-w-0">
          <section id="overview" className="scroll-mt-24 border-b border-border pb-8">
            <p className="mb-3 text-sm font-medium text-primary">VideoFly</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{content.title}</h1>
            <p className="mt-3 text-muted-foreground">{content.intro}</p>
          </section>

          <div className="space-y-6 pt-8">
            {content.tools.map((tool, index) => (
              <section id={`tool-${index + 1}`} key={tool.title} className="scroll-mt-24 rounded-xl border border-border bg-card p-6 md:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
                  <h2 className="text-xl font-semibold">{tool.title}</h2>
                </div>
                <ol className="space-y-4 text-sm leading-6 text-muted-foreground md:text-base">
                  {tool.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-3">
                      <span className="font-medium text-foreground">{stepIndex + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}

            <section id="tips" className="scroll-mt-24 rounded-xl border border-border bg-muted/30 p-6 md:p-8">
              <h2 className="text-xl font-semibold">{locale === "zh" ? "使用建议" : "Tips"}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground md:text-base">
                {content.tips.map((tip) => <li key={tip} className="flex gap-3"><span className="text-primary">•</span><span>{tip}</span></li>)}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
