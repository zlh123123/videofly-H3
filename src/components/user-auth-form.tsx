"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { cn } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import * as Icons from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerServiceDialog } from "@/components/landing/customer-service-dialog";
import { toast } from "sonner";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  lang: string;
  mode?: "login" | "register";
  disabled?: boolean;
}

const userAuthSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
  });

type FormData = z.infer<typeof userAuthSchema>;

export function UserAuthForm({ className, lang, mode = "login", disabled, ...props }: UserAuthFormProps) {
  const t = useTranslations("Login");
  const isRegister = mode === "register";
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(userAuthSchema) });
  const [isLoading, setIsLoading] = React.useState(false);
  const searchParams = useSearchParams();

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const callbackURL = searchParams?.get("from") ?? `/${lang}/my-creations`;
    try {
      const result = isRegister
        ? await authClient.signUp.email({ email: data.email.toLowerCase(), password: data.password, name: data.email.split("@")[0], callbackURL })
        : await authClient.signIn.email({ email: data.email.toLowerCase(), password: data.password, callbackURL });
      if (result.error) throw new Error(result.error.message || t("error_detail"));
      toast.success(isRegister ? t("register_success") : t("login_success"));
      window.location.assign(callbackURL);
    } catch (error) {
      console.error(`${mode} request failed:`, error);
      const detail = error instanceof Error && error.message ? error.message : "";
      const userDetail = /already exists|already registered|unique/i.test(detail)
        ? t("email_already_registered")
        : detail;
      toast.error(t("error"), {
        description: userDetail || (isRegister ? t("register_error_detail") : t("error_detail")),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-5", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-email`}>{t("email_label")}</Label>
          <Input id={`${mode}-email`} placeholder={t("email_placeholder")} type="email" autoComplete="email" disabled={isLoading || disabled} {...register("email")} />
          {errors.email && <p className="text-xs text-red-600">{t("invalid_email")}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-password`}>{t("password_label")}</Label>
          <Input id={`${mode}-password`} placeholder={t("password_placeholder")} type="password" autoComplete={isRegister ? "new-password" : "current-password"} disabled={isLoading || disabled} {...register("password")} />
          {errors.password && <p className="text-xs text-red-600">{t("password_min_length")}</p>}
        </div>
        {isRegister && (
          <div className="grid gap-2">
            <Label htmlFor="register-confirm-password">{t("confirm_password_label")}</Label>
            <Input id="register-confirm-password" placeholder={t("confirm_password_placeholder")} type="password" autoComplete="new-password" disabled={isLoading || disabled} {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-red-600">{t("password_mismatch")}</p>}
          </div>
        )}
        <button type="submit" className={cn(buttonVariants(), "mt-2 w-full")} disabled={isLoading || disabled}>
          {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
          {isRegister ? t("create_account") : t("signin_email")}
        </button>
      </form>
      {!isRegister && <div className="flex justify-center"><CustomerServiceDialog compact triggerLabel={t("forgot_password")} /></div>}
    </div>
  );
}
