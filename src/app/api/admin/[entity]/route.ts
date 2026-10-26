import { ApiError, audit, requireAdmin } from "@/lib/auth";
import { readJson, safeRoute, toInt } from "@/lib/http";
import { createEntityRow, entitySchemas, listEntity, listReadOnly, type EntityName } from "@/lib/admin-registry";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ entity: string }> };

const isEntity = (v: string): v is EntityName => v in entitySchemas;
const isReadOnly = (v: string): v is "quizAttempts" | "certificates" => v === "quizAttempts" || v === "certificates";

function assertEntity(value: string): EntityName {
  if (!isEntity(value)) throw new ApiError(404, "الكيان غير معروف");
  return value;
}

export async function GET(req: Request, ctx: Ctx) {
  const { entity } = await ctx.params;
  return safeRoute(async () => {
    await requireAdmin();
    const url = new URL(req.url);
    const page = toInt(url.searchParams.get("page"), 1);
    const pageSize = toInt(url.searchParams.get("pageSize"), 20);
    const search = url.searchParams.get("q")?.trim() || undefined;

    if (isReadOnly(entity)) {
      const data = await listReadOnly(entity, { page, pageSize });
      return Response.json({ ok: true, data });
    }

    const name = assertEntity(entity);
    const filters: Record<string, string | undefined> = {};
    for (const key of ["stageId", "subjectId", "courseId", "quizId", "userId", "role", "status", "level", "isPublished", "isFeatured", "isActive", "audience"]) {
      const v = url.searchParams.get(key);
      if (v) filters[key] = v;
    }
    const data = await listEntity(name, { page, pageSize, search, filters });
    return Response.json({ ok: true, data });
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { entity } = await ctx.params;
  return safeRoute(async () => {
    const admin = await requireAdmin();
    const name = assertEntity(entity);
    const body = (await readJson<Record<string, unknown>>(req)) ?? {};
    const created = await createEntityRow(name, body, admin.id);
    await audit(`admin.${name}.create`, { userId: admin.id, entity: name, entityId: String((created as Record<string, unknown>).id ?? "") });
    return Response.json({ ok: true, message: "تمت الإضافة بنجاح", data: created }, { status: 201 });
  });
}
