import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  ApiError, audit, clientFingerprint, createSession, destroySession, getCurrentUser,
  hashPassword, rateLimit, stripSecret, verifyPassword,
} from "@/lib/auth";
import { readJson, safeRoute } from "@/lib/http";
import { COUNTRIES, SUPPORTED_COUNTRY_CODES, SUPPORTED_COUNTRIES_LABEL, isValidPhone, normalizePhone, type CountryCode } from "@/lib/countries";
import { getUserStats } from "@/lib/data";

export const dynamic = "force-dynamic";

const countryEnum = z.enum(SUPPORTED_COUNTRY_CODES as unknown as [CountryCode, ...CountryCode[]], {
  errorMap: () => ({ message: `المنصة متاحة في ${SUPPORTED_COUNTRIES_LABEL} فقط` }),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(3, "الاسم يجب ألا يقل عن ٣ أحرف").max(80, "الاسم طويل جدًا"),
  country: countryEnum,
  email: z.string().trim().toLowerCase().email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب ألا تقل عن ٨ خانات")
    .max(72, "كلمة المرور طويلة جدًا")
    .regex(/[A-Za-z\u0600-\u06FF]/, "يجب أن تحتوي كلمة المرور على حرف")
    .regex(/\d/, "يجب أن تحتوي كلمة المرور على رقم"),
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  stageId: z.string().uuid().optional().or(z.literal("")),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية"),
  newPassword: z
    .string()
    .min(8, "كلمة المرور يجب ألا تقل عن ٨ خانات")
    .regex(/\d/, "يجب أن تحتوي كلمة المرور على رقم")
    .regex(/[A-Za-z\u0600-\u06FF]/, "يجب أن تحتوي كلمة المرور على حرف"),
});

type Ctx = { params: Promise<{ action: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { action } = await ctx.params;
  return safeRoute(async () => {
    if (action === "register") return register(req);
    if (action === "login") return login(req);
    if (action === "logout") return logout();
    if (action === "change-password") return changePassword(req);
    throw new ApiError(404, "الإجراء غير معروف");
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  const { action } = await ctx.params;
  return safeRoute(async () => {
    if (action === "me") {
      const user = await getCurrentUser();
      if (!user) return Response.json({ ok: true, data: { user: null } });
      const stats = await getUserStats(user.id);
      return Response.json({ ok: true, data: { user, stats } });
    }
    throw new ApiError(404, "الإجراء غير معروف");
  });
}

async function register(req: Request) {
  const key = await clientFingerprint("register");
  if (!(await rateLimit(key, 5, 10 * 60_000))) {
    throw new ApiError(429, "تم تجاوز عدد محاولات التسجيل المسموح، حاول لاحقًا");
  }
  const body = registerSchema.parse(await readJson(req));

  // بوابة الدول المدعومة: لا يُقبل تسجيل من خارجها
  if (!SUPPORTED_COUNTRY_CODES.includes(body.country)) {
    throw new ApiError(403, `التسجيل متاح في ${SUPPORTED_COUNTRIES_LABEL} فقط`);
  }
  if (body.phone && !isValidPhone(body.phone, body.country)) {
    throw new ApiError(422, `رقم الجوال غير مطابق لصيغة ${COUNTRIES[body.country].nameAr} — مثال: ${COUNTRIES[body.country].phoneExample}`);
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
  if (existing.length) throw new ApiError(409, "هذا البريد الإلكتروني مسجّل بالفعل");

  const [created] = await db
    .insert(users)
    .values({
      fullName: body.fullName,
      email: body.email,
      passwordHash: hashPassword(body.password),
      role: "student", // التسجيل العام يمنح دور طالب فقط؛ الأدوار الإدارية تُمنح داخليًا
      country: body.country,
      phone: normalizePhone(body.phone || "", body.country),
      city: body.city || null,
      stageId: body.stageId || null,
    })
    .returning();

  await createSession(created.id, { userAgent: req.headers.get("user-agent") ?? undefined });
  await audit("auth.register", { userId: created.id, entity: "user", entityId: created.id, meta: { country: body.country } });
  return Response.json({ ok: true, message: "تم إنشاء حسابك في نبراس بنجاح", data: { user: stripSecret(created) } }, { status: 201 });
}

async function login(req: Request) {
  const body = loginSchema.parse(await readJson(req));
  const key = await clientFingerprint(`login:${body.email}`);
  if (!(await rateLimit(key, 6, 5 * 60_000))) {
    await audit("auth.login.rate_limited", { meta: { email: body.email } });
    throw new ApiError(429, "محاولات دخول كثيرة جدًا، انتظر بضع دقائق ثم أعد المحاولة");
  }

  const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
  // رسالة موحّدة تمنع تسريب وجود الحساب من عدمه
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    await audit("auth.login.failed", { userId: user?.id ?? null, meta: { email: body.email } });
    throw new ApiError(401, "بيانات الدخول غير صحيحة");
  }
  if (user.status !== "active" || !user.isActive) {
    throw new ApiError(403, "تم إيقاف هذا الحساب، يرجى التواصل مع إدارة المنصة");
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id, { userAgent: req.headers.get("user-agent") ?? undefined });
  await audit("auth.login.success", { userId: user.id, entity: "user", entityId: user.id });
  return Response.json({ ok: true, message: `أهلًا بك ${user.fullName}`, data: { user: stripSecret(user) } });
}

async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit("auth.logout", { userId: user.id });
  return Response.json({ ok: true, message: "تم تسجيل الخروج" });
}

async function changePassword(req: Request) {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "يجب تسجيل الدخول");
  const key = await clientFingerprint("password");
  if (!(await rateLimit(key, 5, 15 * 60_000))) throw new ApiError(429, "محاولات كثيرة، حاول لاحقًا");

  const body = passwordSchema.parse(await readJson(req));
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !verifyPassword(body.currentPassword, row.passwordHash)) {
    throw new ApiError(401, "كلمة المرور الحالية غير صحيحة");
  }
  await db.update(users).set({ passwordHash: hashPassword(body.newPassword), updatedAt: new Date() }).where(eq(users.id, user.id));
  await audit("auth.password_changed", { userId: user.id, entity: "user", entityId: user.id });
  return Response.json({ ok: true, message: "تم تحديث كلمة المرور بنجاح" });
}
