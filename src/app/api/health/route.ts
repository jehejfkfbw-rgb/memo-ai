import { db, databaseStatus } from "@/db";
import { sql } from "drizzle-orm";
import { bootstrap, bootstrapStatus } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

/** فحص صحيّة الخدمة: حالة إعداد قاعدة البيانات وإمكانية الاتصال الفعلية */
export async function GET() {
  const status = databaseStatus();

  if (!status.configured) {
    return Response.json(
      {
        ok: false,
        database: { connected: false, configured: false, source: null },
        message: status.message,
      },
      { status: 503 },
    );
  }

  try {
    await bootstrap();
    await db.execute(sql`select 1`);
    return Response.json({
      ok: true,
      database: { ...bootstrapStatus(), connected: true, configured: true, source: status.source },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        database: { connected: false, configured: true, source: status.source },
        message: "تعذّر الاتصال بقاعدة البيانات — تحقق من قيمة DATABASE_URL ومن قواعد الشبكة في Supabase",
        detail: (error as Error).message,
      },
      { status: 503 },
    );
  }
}
