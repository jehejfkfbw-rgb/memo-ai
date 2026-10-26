import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { contactMessages, stages, users } from "@/db/schema";
import { ApiError, audit, clientFingerprint, getCurrentUser, rateLimit, requireUser } from "@/lib/auth";
import { readJson, safeRoute } from "@/lib/http";
import { COUNTRIES, SUPPORTED_COUNTRY_CODES, SUPPORTED_COUNTRIES_LABEL, countryOptions, isValidPhone, normalizePhone, type CountryCode } from "@/lib/countries";

export const dynamic = "force-dynamic";

const countryEnum = z.enum(SUPPORTED_COUNTRY_CODES as unknown as [CountryCode, ...CountryCode[]], {
  errorMap: () => ({ message: `المنصة متاحة في ${SUPPORTED_COUNTRIES_LABEL} فقط` }),
});

const profileSchema = z.object({
  country: countryEnum.optional(),
  fullName: z.string().trim().min(3, "الاسم يجب ألا يقل عن ٣ أحرف").max(80).optional(),
  phone: z.string().trim().max(24).nullable().optional(),
  city: z.string().trim().max(60).nullable().optional(),
  bio: z.string().trim().max(400, "النبذة يجب ألا تتجاوز ٤٠٠ حرف").nullable().optional(),
  avatarUrl: z.string().trim().url("رابط الصورة غير صالح").max(500).nullable().optional().or(z.literal("")),
  stageId: z.string().uuid().nullable().optional().or(z.literal("")),
});

const contactSchema = z.object({
  name: z.string().trim().min(3, "أدخل الاسم كاملًا").max(80),
  email: z.string().trim().toLowerCase().email("صيغة البريد الإلكتروني غير صحيحة"),
  subject: z.string().trim().min(3, "أدخل موضوع الرسالة").max(120),
  message: z.string().trim().min(15, "الرسالة قصيرة جدًا").max(2000, "الرسالة طويلة جدًا"),
});

/** GET /api/profile — بيانات الحساب الحالي */
export async function GET() {
  return safeRoute(async () => {
    const user = await requireUser();
    const stageRows = await db.select({ id: stages.id, name: stages.name }).from(stages).orderBy(stages.sortOrder);
    return Response.json({
      ok: true,
      data: { user, stages: stageRows, countries: countryOptions(), supportedCountries: SUPPORTED_COUNTRIES_LABEL },
    });
  });
}

/** PATCH /api/profile — تحديث الملف الشخصي */
export async function PATCH(req: Request) {
  return safeRoute(async () => {
    const user = await requireUser();
    const body = profileSchema.parse(await readJson(req));

    const nextCountry = body.country ?? user.country ?? null;
    if (body.phone && !isValidPhone(body.phone, nextCountry)) {
      const c = COUNTRIES[(nextCountry ?? "EG") as CountryCode];
      throw new ApiError(422, `رقم الجوال غير مطابق لصيغة ${c.nameAr} — مثال: ${c.phoneExample}`);
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.fullName !== undefined) patch.fullName = body.fullName;
    if (body.country !== undefined) patch.country = body.country;
    if (body.phone !== undefined) patch.phone = body.phone ? normalizePhone(body.phone, nextCountry) : null;
    if (body.city !== undefined) patch.city = body.city || null;
    if (body.bio !== undefined) patch.bio = body.bio || null;
    if (body.avatarUrl !== undefined) patch.avatarUrl = body.avatarUrl || null;
    if (body.stageId !== undefined) {
      if (body.stageId) {
        const [stage] = await db.select({ id: stages.id }).from(stages).where(eq(stages.id, body.stageId)).limit(1);
        if (!stage) throw new ApiError(404, "المرحلة التعليمية غير موجودة");
      }
      patch.stageId = body.stageId || null;
    }

    const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    await audit("profile.updated", { userId: user.id, entity: "user", entityId: user.id });
    return Response.json({ ok: true, message: "تم حفظ بياناتك الشخصية", data: { user: updated } });
  });
}

/** POST /api/profile — إرسال رسالة تواصل (متاح للزوار أيضًا عبر /api/contact) */
export async function POST(req: Request) {
  return safeRoute(async () => {
    const key = await clientFingerprint("contact");
    if (!(await rateLimit(key, 4, 10 * 60_000))) {
      throw new ApiError(429, "أرسلت رسائل كثيرة مؤخرًا، حاول بعد قليل");
    }
    const body = contactSchema.parse(await readJson(req));
    const me = await getCurrentUser();

    const [row] = await db
      .insert(contactMessages)
      .values({ name: body.name, email: body.email, subject: body.subject, message: body.message, status: "new" })
      .returning();
    await audit("contact.created", { userId: me?.id ?? null, entity: "contact_message", entityId: row.id });
    return Response.json({ ok: true, message: "وصلتنا رسالتك، وسيتواصل معك فريق نبراس قريبًا", data: { id: row.id } }, { status: 201 });
  });
}
