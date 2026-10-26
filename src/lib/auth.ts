import { createHmac, randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, auditLogs, type PublicUser, type Role } from "@/db/schema";

export const SESSION_COOKIE = "nebras_session";
export const SESSION_DAYS = 30;
const SESSION_TTL_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

/* ----------------------------- كلمات المرور ----------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password.normalize("NFKC"), salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const derived = scryptSync(password.normalize("NFKC"), salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* -------------------------------- الرموز -------------------------------- */

const tokenSecret = () => process.env.SESSION_SECRET || "nebras-development-secret-change-me";

export function signToken(value: string): string {
  return createHmac("sha256", tokenSecret()).update(value).digest("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/* -------------------------------- الجلسات -------------------------------- */

export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }) {
  const raw = randomBytes(32).toString("base64url");
  const token = `${raw}.${signToken(raw)}`;
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    userAgent: meta?.userAgent?.slice(0, 300) ?? null,
    ipAddress: meta?.ip ?? null,
    expiresAt,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  store.delete(SESSION_COOKIE);
}

export function stripSecret(user: { passwordHash: string } & Record<string, unknown>): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest as unknown as PublicUser;
}

/** قراءة المستخدم الحالي من الكوكي (يعيد null إذا لم توجد جلسة صالحة) */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [raw, sig] = token.split(".");
  if (!raw || !sig || sig !== signToken(raw)) return null;

  const rows = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.user.status !== "active" || !row.user.isActive) return null;
  return stripSecret(row.user);
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "يجب تسجيل الدخول للمتابعة");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<PublicUser> {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) {
    throw new ApiError(403, "لا تملك صلاحية الوصول إلى هذا المورد");
  }
  return user;
}

export const requireAdmin = () => requireRole("admin");
export const requireStaff = () => requireRole("admin", "teacher");

/* ------------------------------- الأخطاء ------------------------------- */

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/* --------------------------- تحديد معدل الطلبات --------------------------- */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** محدّد معدل بسيط في الذاكرة يحمي نقاط الدخول الحساسة */
export async function rateLimit(key: string, limit = 10, windowMs = 60_000): Promise<boolean> {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > limit) return false;
  return true;
}

export async function clientFingerprint(prefix: string) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "local";
  return `${prefix}:${ip}`;
}

/* ------------------------------ سجل التدقيق ------------------------------ */

export async function audit(
  action: string,
  opts: { userId?: string | null; entity?: string; entityId?: string; meta?: Record<string, unknown> } = {},
) {
  try {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
    await db.insert(auditLogs).values({
      action,
      userId: opts.userId ?? null,
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      meta: opts.meta ?? {},
      ipAddress: ip,
    });
  } catch {
    /* سجل التدقيق لا يجب أن يكسر العملية الأساسية */
  }
}
