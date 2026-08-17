"use client";

import { Check, Copy, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WECHAT_ID = "Wowanyuanshen6666";

export function CustomerServiceDialog({
  compact = false,
  triggerLabel = "联系客服",
}: {
  compact?: boolean;
  triggerLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyWechat = async () => {
    await navigator.clipboard.writeText(WECHAT_ID);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={compact ? "ghost" : "outline"} size="sm" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>联系客服</DialogTitle>
          <DialogDescription>添加微信，获取使用帮助或反馈问题。</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center rounded-lg border border-border bg-white p-3">
          <Image
            src="/customer-service-qr.jpg"
            alt="微信二维码"
            width={360}
            height={446}
            className="h-auto w-full max-w-[320px]"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <span className="font-mono text-base font-medium">{WECHAT_ID}</span>
          <Button variant="ghost" size="sm" onClick={copyWechat} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? "已复制" : "复制"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
