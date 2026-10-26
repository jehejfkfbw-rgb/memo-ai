import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * طبقة الاتصال بقاعدة البيانات (PostgreSQL / Supabase).
 *
 * قواعد التصميم هنا:
 *  1) لا يُرمى أي استثناء عند استيراد الملف — لأن Next.js يستورد هذا الملف أثناء
 *     `next build` (جمع بيانات الصفحات)، وأي throw هنا يُفشل النشر بخطأ
 *     "DATABASE_URL is required" حتى لو كانت الصفحة ديناميكية.
 *  2) يُقرأ رابط الاتصال من عدة أسماء شائعة (Supabase / Vercel Postgres / PG*).
 *  3) الاتصال كسول (lazy) مع إعدادات مناسبة للـ serverless.
 */

type DatabaseStatus = {
  configured: boolean;
  source: string | null;
  message: string | null;
};

/** رابط بديل لا يُستخدم فعليًا إلا إذا حاول أحدهم تنفيذ استعلام بلا إعداد */
const PLACEHOLDER_URL = "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

function readConnectionString(): { url: string | null; source: string | null } {
  const directCandidates: Array<[string, string | undefined]> = [
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["SUPABASE_DB_URL", process.env.SUPABASE_DB_URL],
    ["POSTGRES_URL", process.env.POSTGRES_URL],
    ["PGURL", process.env.PGURL],
    ["POSTGRES_PRISMA_URL", process.env.POSTGRES_PRISMA_URL],
  ];
  for (const [source, value] of directCandidates) {
    if (value && value.trim().length > 0) return { url: value.trim(), source };
  }

  // متغيرات منفصلة (النمط الذي يضبطه تكامل Supabase مع Vercel)
  const host = process.env.PGHOST ?? process.env.SUPABASE_DB_HOST;
  const user = process.env.PGUSER ?? process.env.SUPABASE_DB_USER;
  const password = process.env.PGPASSWORD ?? process.env.SUPABASE_DB_PASSWORD;
  const database = process.env.PGDATABASE ?? process.env.SUPABASE_DB_NAME ?? "postgres";
  const port = process.env.PGPORT ?? process.env.SUPABASE_DB_PORT ?? "5432";
  if (host && user && password) {
    return {
      url: `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`,
      source: "PGHOST/PGUSER/PGPASSWORD",
    };
  }
  return { url: null, source: null };
}

const resolved = readConnectionString();

/** هل يحتاج الاتصال إلى SSL؟ (Supabase يفرض TLS) */
function needsSsl(url: string): boolean {
  return (
    /supabase\.(co|in|me|org|com)|\.pooler\.|neon\.tech|render\.com|railway\.app|flycast/i.test(url) ||
    url.includes("sslmode=require") ||
    url.includes("ssl=true")
  );
}

export const databaseUrl: string | null = resolved.url;
export const databaseSource: string | null = resolved.source;
export const isDatabaseConfigured = Boolean(resolved.url);

export function databaseStatus(): DatabaseStatus {
  if (resolved.url) {
    return { configured: true, source: resolved.source, message: null };
  }
  return {
    configured: false,
    source: null,
    message:
      "لم يتم ضبط متغير قاعدة البيانات. أضف DATABASE_URL (أو SUPABASE_DB_URL أو PGHOST/PGUSER/PGPASSWORD) في إعدادات البيئة.",
  };
}

/** خطأ واضح يُستخدم عند محاولة تنفيذ استعلام دون إعداد قاعدة البيانات */
export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "قاعدة البيانات غير مُعدّة: أضف DATABASE_URL أو SUPABASE_DB_URL في متغيرات البيئة (Vercel → Project → Settings → Environment Variables).",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __nebrasPool?: Pool;
  __nebrasUrl?: string | null;
};

function createPool(): Pool {
  const url = resolved.url ?? PLACEHOLDER_URL;
  return new Pool({
    connectionString: url,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
    max: 5, // مناسب لبيئة serverless
    idleTimeoutMillis: 60_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
}

// إعادة استخدام الاتصال في التطوير (Hot Reload) أو عند تغيّر الرابط
export const pool: Pool =
  globalForDb.__nebrasPool && globalForDb.__nebrasUrl === resolved.url
    ? globalForDb.__nebrasPool
    : createPool();

globalForDb.__nebrasPool = pool;
globalForDb.__nebrasUrl = resolved.url;

export const db = drizzle(pool);
