"use client";

// ============================================
// 积分余额组件
// ============================================

import { useTranslations } from "next-intl";
import { cn } from "@/components/ui";
import type { CreditBalance } from "@/lib/types/dashboard";

interface BalanceCardProps {
  balance: CreditBalance | null;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const t = useTranslations("dashboard.credits");

  if (!balance) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading balance...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* RMB balance */}
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold">
          ¥{balance.availableCredits.toLocaleString()}
        </span>
        <span className="text-muted-foreground">可用余额</span>
      </div>

      {/* 已用积分 */}
      <div className="text-sm text-muted-foreground">
        已消费: ¥{balance.usedCredits.toLocaleString()}
      </div>

    </div>
  );
}
