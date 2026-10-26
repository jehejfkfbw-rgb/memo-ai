import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { certificates, courses, stages, users } from "@/db/schema";
import { ApiError, clientFingerprint, rateLimit } from "@/lib/auth";
import { safeRoute } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/certificates/verify?code=NBR-XXXX — تحقق عام من صحة شهادة */
export async function GET(req: Request) {
  return safeRoute(async () => {
    const key = await clientFingerprint("verify");
    if (!(await rateLimit(key, 20, 60_000))) throw new ApiError(429, "طلبات كثيرة، حاول بعد دقيقة");

    const url = new URL(req.url);
    const code = url.searchParams.get("code")?.trim().toUpperCase();
    if (!code) throw new ApiError(400, "أدخل رمز الشهادة");

    const rows = await db
      .select({
        code: certificates.code,
        grade: certificates.grade,
        issuedAt: certificates.issuedAt,
        student: users.fullName,
        course: courses.title,
        stage: stages.name,
      })
      .from(certificates)
      .innerJoin(users, eq(users.id, certificates.userId))
      .innerJoin(courses, eq(courses.id, certificates.courseId))
      .innerJoin(stages, eq(stages.id, courses.stageId))
      .where(sql`upper(${certificates.code}) = ${code}`)
      .limit(1);

    if (!rows.length) {
      return Response.json({ ok: true, data: { valid: false, message: "لا توجد شهادة بهذا الرمز في سجلات نبراس" } });
    }
    return Response.json({ ok: true, data: { valid: true, certificate: rows[0] } });
  });
}
