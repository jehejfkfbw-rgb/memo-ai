import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { ApiError, audit, clientFingerprint, rateLimit } from "@/lib/auth";
import { readJson, safeRoute } from "@/lib/http";
import { SUPPORTED_COUNTRY_CODES, type CountryCode } from "@/lib/countries";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(3, "أدخل الاسم كاملًا").max(80, "الاسم طويل جدًا"),
  email: z.string().trim().toLowerCase().email("صيغة البريد الإلكتروني غير صحيحة"),
  subject: z.string().trim().min(3, "أدخل موضوع الرسالة").max(120),
  message: z.string().trim().min(15, "اكتب رسالة من ١٥ حرفًا على الأقل").max(2000, "الرسالة طويلة جدًا"),
  country: z.enum(SUPPORTED_COUNTRY_CODES as unknown as [CountryCode, ...CountryCode[]]).optional(),
  website: z.string().max(0).optional(), // فخّ ضد الرسائل الآلية
});

/** POST /api/contact — استقبال رسائل الزوار وحفظها في قاعدة البيانات */
export async function POST(req: Request) {
  return safeRoute(async () => {
    const key = await clientFingerprint("contact");
    if (!(await rateLimit(key, 4, 10 * 60_000))) {
      throw new ApiError(429, "أرسلت رسائل كثيرة مؤخرًا، الرجاء المحاولة بعد قليل");
    }
    const body = schema.parse(await readJson(req));
    if (body.website) throw new ApiError(400, "طلب غير صالح");

    const [row] = await db
      .insert(contactMessages)
      .values({ name: body.name, email: body.email, subject: body.subject, message: body.message, country: body.country ?? null, status: "new" })
      .returning({ id: contactMessages.id, createdAt: contactMessages.createdAt });

    await audit("contact.created", { entity: "contact_message", entityId: row.id, meta: { subject: body.subject } });
    return Response.json(
      { ok: true, message: "شكرًا لتواصلك مع نبراس — وصلت رسالتك لفريق الدعم", data: row },
      { status: 201 },
    );
  });
}
