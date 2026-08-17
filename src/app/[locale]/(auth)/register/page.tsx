import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { UserAuthForm } from "@/components/user-auth-form";
import type { Locale } from "@/config/i18n-config";

export const metadata = {
  title: "Create an account",
  description: "Create an account to get started.",
};

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Login");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-muted/20 px-4 py-16">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" width={52} height={52} alt="VideoFly 图标" className="rounded-xl" />
          <span className="text-3xl font-bold tracking-tight">VideoFly</span>
        </div>
        <div className="w-full rounded-2xl border border-border/70 bg-background px-6 py-10 shadow-sm sm:px-12 sm:py-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">{t("create_account")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("create_account_desc")}</p>
          </div>
          <Suspense fallback={<div className="h-40" />}>
            <UserAuthForm lang={locale} mode="register" />
          </Suspense>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {locale === "zh" ? "已有账户？" : "Already have an account?"}{" "}
            <Link href={`/${locale}/login`} className="font-medium text-primary hover:underline">
              {locale === "zh" ? "登录" : "Log in"}
            </Link>
          </p>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            {t("agree_prefix")} <Link href={`/${locale}/terms`} className="underline underline-offset-4">{t("terms_of_service")}</Link> {t("and")} <Link href={`/${locale}/privacy`} className="underline underline-offset-4">{t("privacy_policy")}</Link>。
          </p>
        </div>
      </div>
    </div>
  );
}
