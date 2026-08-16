import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { eq, inArray } from "drizzle-orm";

import {
  creditPackages,
  creditTransactions,
  db,
  redeemCodes,
  users,
} from "@/db";
import { generateRedeemCodes, redeemCode } from "@/services/redeem-code";

if (process.env.ALLOW_REDEEM_INTEGRATION_TEST !== "true") {
  throw new Error(
    "Set ALLOW_REDEEM_INTEGRATION_TEST=true to run this database integration test."
  );
}

const testId = `redeem-test-${Date.now()}`;
const testEmail = `${testId}@example.invalid`;
const batchIds: string[] = [];

function hashCode(code: string) {
  const normalized = code.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return createHash("sha256").update(normalized).digest("hex");
}

async function cleanup() {
  await db.delete(creditTransactions).where(eq(creditTransactions.userId, testId));
  await db.delete(creditPackages).where(eq(creditPackages.userId, testId));
  if (batchIds.length > 0) {
    await db.delete(redeemCodes).where(inArray(redeemCodes.batchId, batchIds));
  }
  await db.delete(users).where(eq(users.id, testId));
}

async function main() {
  await db.insert(users).values({
    id: testId,
    name: "Redeem integration test",
    email: testEmail,
    emailVerified: true,
  });

  const generated = await generateRedeemCodes({ count: 1, faceValue: 7 });
  batchIds.push(generated.batchId);
  const [code] = generated.codes;
  assert.ok(code);
  assert.match(code, /^[A-Z2-9]{5}(?:-[A-Z2-9]{5}){3}$/);

  const [storedBefore] = await db
    .select()
    .from(redeemCodes)
    .where(eq(redeemCodes.batchId, generated.batchId));
  assert.ok(storedBefore);
  assert.equal(storedBefore.codeHash, hashCode(code));
  assert.equal(storedBefore.status, "AVAILABLE");

  const redeemed = await redeemCode({ userId: testId, code });
  assert.equal(redeemed.faceValue, 7);

  const [storedAfter] = await db
    .select()
    .from(redeemCodes)
    .where(eq(redeemCodes.id, storedBefore.id));
  assert.equal(storedAfter?.status, "REDEEMED");
  assert.equal(storedAfter?.redeemedBy, testId);
  assert.ok(storedAfter?.redeemedAt);

  const [creditPackage] = await db
    .select()
    .from(creditPackages)
    .where(eq(creditPackages.id, redeemed.packageId));
  assert.equal(creditPackage?.initialCredits, 7);
  assert.equal(creditPackage?.remainingCredits, 7);
  assert.equal(creditPackage?.transType, "REDEEM_CODE");

  const [transaction] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.packageId, redeemed.packageId));
  assert.equal(transaction?.credits, 7);
  assert.equal(transaction?.balanceAfter, 7);
  assert.equal(transaction?.transType, "REDEEM_CODE");

  await assert.rejects(
    () => redeemCode({ userId: testId, code }),
    /invalid, expired, or already used/i
  );

  const expired = await generateRedeemCodes({
    count: 1,
    faceValue: 3,
    expiresAt: new Date(Date.now() - 60_000),
  });
  batchIds.push(expired.batchId);
  await assert.rejects(
    () => redeemCode({ userId: testId, code: expired.codes[0]! }),
    /invalid, expired, or already used/i
  );

  console.log(
    "Redeem integration test passed: hash-only storage, credit package, ledger, one-time use, and expiry."
  );
}

main()
  .then(cleanup)
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error);
    await cleanup().catch((cleanupError) => {
      console.error("Cleanup failed:", cleanupError);
    });
    process.exit(1);
  });
