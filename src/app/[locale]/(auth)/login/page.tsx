import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { UserAuthForm } from "@/components/user-auth-form";
import type { Locale } from "@/config/i18n-config";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{
    locale: Locale;
  }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Login");
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-muted/20 px-4 py-16">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            width={52}
            height={52}
            alt="VideoFly 图标"
            className="rounded-xl"
          />
          <span className="text-3xl font-bold tracking-tight">VideoFly</span>
        </div>

        <div className="w-full rounded-2xl border border-border/70 bg-background px-6 py-10 shadow-sm sm:px-12 sm:py-12">
          <div className="mb-8 flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("welcome_back")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("signin_title")}
            </p>
          </div>
          <Suspense fallback={<div className="h-40" />}>
            <UserAuthForm lang={locale} />
          </Suspense>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {locale === "zh" ? "还没有账户？" : "Don't have an account?"}{" "}
            <Link href={`/${locale}/register`} className="font-medium text-primary hover:underline">
              {t("signup")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
