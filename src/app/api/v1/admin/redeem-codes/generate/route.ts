import { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { generateRedeemCodes } from "@/services/redeem-code";

const generateSchema = z.object({
  count: z.number().int().min(1).max(100_000),
  faceValue: z.number().int().positive(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("生成参数无效", 400, parsed.error.flatten().fieldErrors);
    }

    const expiresAt = parsed.data.expiresAt
      ? new Date(parsed.data.expiresAt)
      : null;
    if (expiresAt && expiresAt <= new Date()) {
      return apiError("有效期必须晚于当前时间", 400);
    }

    const result = await generateRedeemCodes({
      count: parsed.data.count,
      faceValue: parsed.data.faceValue,
      expiresAt,
    });
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
