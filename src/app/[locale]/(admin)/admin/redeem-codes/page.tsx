import { desc, sql } from "drizzle-orm";

import { RedeemCodeManager } from "@/components/admin/redeem-codes/redeem-code-manager";
import { db, redeemCodes } from "@/db";

export const dynamic = "force-dynamic";

export default async function RedeemCodesPage() {
  const [summaryResult, batchResults] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        available: sql<number>`count(*) filter (where ${redeemCodes.status} = 'AVAILABLE' and (${redeemCodes.expiresAt} is null or ${redeemCodes.expiresAt} > now()))::int`,
        redeemed: sql<number>`count(*) filter (where ${redeemCodes.status} = 'REDEEMED')::int`,
        redeemedValue: sql<number>`coalesce(sum(case when ${redeemCodes.status} = 'REDEEMED' then ${redeemCodes.faceValue} else 0 end), 0)::int`,
      })
      .from(redeemCodes),
    db
      .select({
        batchId: redeemCodes.batchId,
        faceValue: redeemCodes.faceValue,
        totalCount: sql<number>`count(*)::int`,
        availableCount: sql<number>`count(*) filter (where ${redeemCodes.status} = 'AVAILABLE' and (${redeemCodes.expiresAt} is null or ${redeemCodes.expiresAt} > now()))::int`,
        redeemedCount: sql<number>`count(*) filter (where ${redeemCodes.status} = 'REDEEMED')::int`,
        expiresAt: sql<Date | null>`max(${redeemCodes.expiresAt})`,
        createdAt: sql<Date>`min(${redeemCodes.createdAt})`,
      })
      .from(redeemCodes)
      .groupBy(redeemCodes.batchId, redeemCodes.faceValue)
      .orderBy(desc(sql`min(${redeemCodes.createdAt})`))
      .limit(50),
  ]);

  const summary = summaryResult[0] ?? {
    total: 0,
    available: 0,
    redeemed: 0,
    redeemedValue: 0,
  };

  return (
    <RedeemCodeManager
      summary={{
        total: Number(summary.total),
        available: Number(summary.available),
        redeemed: Number(summary.redeemed),
        redeemedValue: Number(summary.redeemedValue),
      }}
      batches={batchResults.map((batch) => ({
        batchId: batch.batchId,
        faceValue: batch.faceValue,
        totalCount: Number(batch.totalCount),
        availableCount: Number(batch.availableCount),
        redeemedCount: Number(batch.redeemedCount),
        expiresAt: batch.expiresAt
          ? new Date(batch.expiresAt).toISOString()
          : null,
        createdAt: new Date(batch.createdAt).toISOString(),
      }))}
    />
  );
}
