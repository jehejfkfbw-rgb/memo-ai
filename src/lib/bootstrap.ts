import { databaseStatus, isDatabaseConfigured } from "@/db";
import { ensureSchema, isSchemaReady } from "@/db/migrate";
import { ensureSeed } from "@/db/seed";

/**
 * تهيئة المنصة (المخطط + البيانات الأولية) في وقت التشغيل فقط.
 *
 * مهم للنشر على Vercel:
 *  - أثناء `next build` لا يُنفَّذ أي اتصال بقاعدة البيانات (NEXT_PHASE = phase-production-build)،
 *    لذلك لا يفشل البناء بسبب غياب DATABASE_URL أو عدم الوصول للشبكة.
 *  - في أول طلب خادم حقيقي تُنشأ الجداول (إن لم توجد) ثم تُبذَر البيانات مرة واحدة.
 *  - أي فشل في الاتصال لا يكسر العرض، بل يُسجَّل ويُعاد المحاولة بعد فترة تهدئة.
 */

const COOLDOWN_MS = 30_000;

let inFlight: Promise<void> | null = null;
let done = false;
let nextRetryAt = 0;

export function isBuildPhase(): boolean {
  const phase = process.env.NEXT_PHASE;
  return phase === "phase-production-build" || phase === "phase-info";
}

export async function bootstrap(): Promise<void> {
  if (done || isBuildPhase() || !isDatabaseConfigured) return;
  if (Date.now() < nextRetryAt) return;

  if (!inFlight) {
    inFlight = (async () => {
      try {
        const ready = await ensureSchema();
        if (!ready) throw new Error("schema-unavailable");
        await ensureSeed();
        done = true;
      } catch (error) {
        nextRetryAt = Date.now() + COOLDOWN_MS;
        console.warn("[bootstrap] تهيئة قاعدة البيانات مؤجلة:", (error as Error).message);
      } finally {
        inFlight = null;
      }
    })();
  }
  return inFlight;
}

/** حالة قاعدة البيانات لعرضها في /api/health */
export function bootstrapStatus() {
  const status = databaseStatus();
  return {
    configured: status.configured,
    source: status.source,
    schemaReady: isSchemaReady(),
    seeded: done,
    buildPhase: isBuildPhase(),
    message: status.message,
  };
}
