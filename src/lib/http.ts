import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/auth";
import { DatabaseNotConfiguredError, databaseStatus } from "@/db";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function ok<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({ ok: true, message, data }, { status: 200 });
}

/** هل الخطأ ناتج عن قاعدة البيانات (إعداد ناقص أو اتصال متعذّر)؟ */
export function isDatabaseError(error: unknown): boolean {
  if (error instanceof DatabaseNotConfiguredError) return true;
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return /ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|getaddrinfo|Connection terminated|timeout expired|password authentication failed|no pg_hba\.conf entry|DATABASE_URL|self[- ]signed|SSL connection/i.test(
    message,
  );
}

/**
 * غلاف موحّد لكل مسارات الـ API:
 * يحوّل أخطاء Zod و ApiError وأخطاء قاعدة البيانات إلى استجابات JSON آمنة
 * دون تسريب تفاصيل داخلية (كلمات مرور، أسماء مضifين، استعلامات).
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
    if (isDatabaseError(error)) {
      const status = databaseStatus();
      return NextResponse.json(
        {
          ok: false,
          message: status.configured
            ? "تعذّر الاتصال بقاعدة البيانات حاليًا — تحقق من قيمة DATABASE_URL ومن السماح باتصال Vercel في إعدادات Supabase (Network Restrictions / IPv4)"
            : status.message ?? "قاعدة البيانات غير مُعدّة",
          details: { configured: status.configured, source: status.source },
        },
        { status: 503 },
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
