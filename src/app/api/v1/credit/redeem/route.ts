import { NextRequest } from "next/server";

import { requireAuth } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { redeemCode } from "@/services/redeem-code";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    if (typeof body.code !== "string") return apiSuccess({ error: "Code is required" }, 400);

    const result = await redeemCode({ userId: user.id, code: body.code });
    return apiSuccess({
      amount: result.faceValue,
      packageId: result.packageId,
      message: `Redeemed ¥${result.faceValue} successfully`,
    });
  } catch (error) {
    if (error instanceof Error && /redeem code|invalid redeem code/i.test(error.message)) {
      return apiError(error.message, 400);
    }
    return handleApiError(error);
  }
}
