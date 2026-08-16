"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/dashboard-client";
import { useQueryClient } from "@tanstack/react-query";

export function RedeemCodeForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    try {
      const result = await apiClient.redeemCode(code);
      toast.success(`兑换成功，余额增加 ¥${result.amount}`);
      setCode("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["credit-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["credit-history"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "兑换失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm font-medium">
        兑换码
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="请输入兑换码"
          autoComplete="off"
          className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm tracking-wider outline-none focus:ring-2 focus:ring-primary"
        />
      </label>
      <button type="submit" disabled={loading || !code.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        立即兑换
      </button>
    </form>
  );
}
