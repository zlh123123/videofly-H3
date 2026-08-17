"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import * as Icons from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { useSigninModal } from "@/hooks/use-signin-modal";
import { toast } from "sonner";

interface SignInModalContentProps {
  lang: string;
}

export const SignInModalContent = ({ lang }: SignInModalContentProps) => {
  const t = useTranslations("SignInModal");
  const signInModal = useSigninModal();
  const searchParams = useSearchParams();
  const [signInClicked, setSignInClicked] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const callbackURL = searchParams?.get("from") ?? `/${lang}${siteConfig.routes.defaultLoginRedirect}`;

  const handleSocialLogin = async (provider: "google") => {
    setSignInClicked(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (error) {
      console.error(`${provider} signIn error:`, error);
      setSignInClicked(null);
      toast.error(t("error"), {
        description: t("provider_error", { provider }),
      });
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError(t("invalid_email"));
      return;
    }

    setEmailError("");
    setSignInClicked("email");

    try {
      const result = await authClient.signIn.magicLink({
        email: email.toLowerCase(),
        callbackURL,
      });

      if (result.error) {
        throw new Error(result.error.message || t("send_failed"));
      }

      toast.success(t("email_sent"), {
        description: t("email_sent_detail"),
      });

      setEmail("");
      signInModal.onClose();
    } catch (error) {
      console.error("Magic link signIn error:", error);
      toast.error(t("error"), {
        description: t("error_detail"),
      });
    } finally {
      setSignInClicked(null);
    }
  };

  const isLoading = signInClicked !== null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-3 border-b bg-background px-4 py-6 pt-8 text-center">
        <h3 className="font-urban text-2xl font-bold">
          {t("signin_title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("signin_subtitle")}
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-col space-y-4 bg-secondary/50 px-4 py-8">
        {/* Google Login - Priority */}
        {siteConfig.auth.enableGoogleLogin && (
          <Button
            variant="default"
            className="w-full"
            disabled={isLoading}
            onClick={() => handleSocialLogin("google")}
          >
            {signInClicked === "google" ? (
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.Google className="mr-2 h-4 w-4" />
            )}
            {t("continue_google")}
          </Button>
        )}

        {/* Magic Link Email Login */}
        {siteConfig.auth.enableMagicLinkLogin && (
          <>
            {siteConfig.auth.enableGoogleLogin && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-secondary/50 px-2 text-muted-foreground">
                    {t("or_continue_with")}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleMagicLinkLogin} className="grid gap-2">
              <div className="grid gap-1">
                  <Label className="sr-only" htmlFor="email">
                    {t("email_label")}
                </Label>
                <Input
                  id="email"
                  placeholder={t("email_placeholder")}
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={cn(emailError && "border-red-500")}
                />
                {emailError && (
                  <p className="px-1 text-xs text-red-600">{emailError}</p>
                )}
              </div>
              <Button
                type="submit"
                variant={siteConfig.auth.enableGoogleLogin ? "outline" : "default"}
                className="w-full"
                disabled={isLoading}
              >
                {signInClicked === "email" ? (
                  <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.Mail className="mr-2 h-4 w-4" />
                )}
                {t("continue_email")}
              </Button>
            </form>
          </>
        )}

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground">
          {t("terms_notice")}
        </p>
      </div>
    </div>
  );
};
