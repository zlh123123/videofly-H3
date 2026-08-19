"use client";

// ============================================
// 左侧导航组件
// ============================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImagePlay, Type, Video, FolderOpen, Gem, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui";
import { sidebarNavigation } from "@/config/navigation";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const iconMap = {
  ImagePlay,
  Type,
  Video,
  FolderOpen,
  Gem,
  User,
};

interface SidebarProps {
  lang?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ lang = "en", mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const pathWithoutLang = pathname.replace(new RegExp(`^/${lang}`), "");
  const t = useTranslations("Sidebar");
  const navLabels: Record<string, string> = {
    txt2vid: t("textToVideo"),
    img2vid: t("imageToVideo"),
    ref2vid: t("referenceVideo"),
    creations: t("myCreations"),
    credits: t("credits"),
    settings: t("account"),
  };
  // 渲染导航项
  const renderNavItem = (item: any, isActive: boolean) => {
    const Icon = iconMap[item.icon as keyof typeof iconMap];

    return (
      <Link
        key={item.id}
        href={`/${lang}${item.href}`}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{navLabels[item.id] ?? item.title}</span>
      </Link>
    );
  };

  // Desktop Sidebar
  const DesktopNav = () => (
    <div className="flex flex-col h-full py-4">
      {/* 主导航 */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {sidebarNavigation.map((group) => (
          <div key={group.id} className="space-y-1">
            {group.title && (
              <div className="px-2 mb-2 text-xs font-medium text-muted-foreground">
                {group.id === "video" ? t("video") : group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathWithoutLang === item.href;
                return renderNavItem(item, isActive);
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  // Mobile Nav
  const MobileNav = () => (
    <div className="flex flex-col h-full py-4">
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {sidebarNavigation.map((group) => (
          <div key={group.id} className="space-y-1">
            {group.title && (
              <div className="px-2 mb-2 text-xs font-medium text-muted-foreground">
                {group.id === "video" ? t("video") : group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathWithoutLang === item.href;
                return (
                  <SheetClose key={item.id} asChild>
                    <Link
                      href={`/${lang}${item.href}`}
                      onClick={onMobileClose}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {(() => {
                        const Icon = iconMap[item.icon as keyof typeof iconMap];
                        return Icon && <Icon className="h-4 w-4 shrink-0" />;
                      })()}
                      <span className="truncate">{navLabels[item.id] ?? item.title}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[200px] border-r border-border bg-background">
        <DesktopNav />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <Sheet open={mobileOpen} onOpenChange={onMobileClose ? () => onMobileClose() : undefined}>
          <SheetContent position="left" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
              <SheetHeader className="sr-only">
                <SheetTitle>{t("title")}</SheetTitle>
              </SheetHeader>
              <MobileNav />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
