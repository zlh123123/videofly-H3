import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, redeemCodes } from "@/db";
import { CreditTransType } from "@/db/schema";
import { creditService } from "@/services/credit";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function formatCode(): string {
  const bytes = randomBytes(20);
  let value = "";
  for (const byte of bytes) value += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return value.match(/.{1,5}/g)!.join("-");
}

function normalizeCode(code: string) {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function hashCode(code: string) {
  return createHash("sha256").update(normalizeCode(code)).digest("hex");
}

export async function generateRedeemCodes(params: {
  count: number;
  faceValue: number;
  expiresAt?: Date | null;
}) {
  if (!Number.isInteger(params.count) || params.count < 1 || params.count > 100_000) {
    throw new Error("count must be between 1 and 100000");
  }
  if (!Number.isInteger(params.faceValue) || params.faceValue <= 0) {
    throw new Error("faceValue must be a positive integer RMB amount");
  }

  const batchId = `BATCH_${Date.now()}_${nanoid(6)}`;
  const codes: string[] = [];
  const values: Array<typeof redeemCodes.$inferInsert> = [];
  const seen = new Set<string>();

  while (codes.length < params.count) {
    const code = formatCode();
    const normalized = normalizeCode(code);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    codes.push(code);
    values.push({
      codeHash: hashCode(code),
      faceValue: params.faceValue,
      batchId,
      expiresAt: params.expiresAt ?? null,
    });
  }

  for (let index = 0; index < values.length; index += 1000) {
    await db.insert(redeemCodes).values(values.slice(index, index + 1000));
  }
  return { batchId, codes };
}

export async function redeemCode(params: { userId: string; code: string }) {
  const normalized = normalizeCode(params.code);
  if (normalized.length < 15) throw new Error("Invalid redeem code");

  return db.transaction(async (trx) => {
    const [claimed] = await trx
      .update(redeemCodes)
      .set({ status: "REDEEMED", redeemedBy: params.userId, redeemedAt: new Date() })
      .where(
        and(
          eq(redeemCodes.codeHash, hashCode(normalized)),
          eq(redeemCodes.status, "AVAILABLE"),
          or(isNull(redeemCodes.expiresAt), sql`${redeemCodes.expiresAt} > now()`)
        )
      )
      .returning({ id: redeemCodes.id, faceValue: redeemCodes.faceValue, batchId: redeemCodes.batchId });

    if (!claimed) throw new Error("Redeem code is invalid, expired, or already used");

    // Recharge in the same database transaction so a successful claim always has a ledger entry.
    const result = await creditService.recharge({
      userId: params.userId,
      credits: claimed.faceValue,
      orderNo: `REDEEM_${claimed.id}`,
      transType: CreditTransType.REDEEM_CODE,
      remark: `Redeem code batch ${claimed.batchId}`,
    }, trx);

    return { faceValue: claimed.faceValue, packageId: result.packageId };
  });
}
