import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/auth";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function ok<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({ ok: true, message, data }, { status: 200 });
}

/**
 * غلاف موحّد لكل مسارات الـ API:
 * يحوّل أخطاء Zod و ApiError إلى استجابات JSON آمنة دون تسريب تفاصيل داخلية.
 */
export async function safeRoute(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { ok: false, message: error.message, details: error.details ?? null },
        { status: error.status },
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: "بيانات غير صالحة",
          details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 422 },
      );
    }
    console.error("[api:error]", error);
    return NextResponse.json(
      { ok: false, message: "حدث خطأ غير متوقع في الخادم", details: null },
      { status: 500 },
    );
  }
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "جسم الطلب غير صالح");
  }
}

export function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
