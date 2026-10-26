import { ApiError, audit, requireAdmin } from "@/lib/auth";
import { readJson, safeRoute } from "@/lib/http";
import { deleteEntityRow, entitySchemas, getEntityRow, updateEntityRow, type EntityName } from "@/lib/admin-registry";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ entity: string; id: string }> };

function assertEntity(value: string): EntityName {
  if (!(value in entitySchemas)) throw new ApiError(404, "الكيان غير معروف");
  return value as EntityName;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { entity, id } = await ctx.params;
  return safeRoute(async () => {
    await requireAdmin();
    const name = assertEntity(entity);
    const data = await getEntityRow(name, id);
    return Response.json({ ok: true, data });
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { entity, id } = await ctx.params;
  return safeRoute(async () => {
    const admin = await requireAdmin();
    const name = assertEntity(entity);
    const body = (await readJson<Record<string, unknown>>(req)) ?? {};
    const updated = await updateEntityRow(name, id, body, admin.id);
    await audit(`admin.${name}.update`, { userId: admin.id, entity: name, entityId: id, meta: { fields: Object.keys(body) } });
    return Response.json({ ok: true, message: "تم حفظ التعديلات", data: updated });
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { entity, id } = await ctx.params;
  return safeRoute(async () => {
    const admin = await requireAdmin();
    const name = assertEntity(entity);
    await deleteEntityRow(name, id, admin.id);
    await audit(`admin.${name}.delete`, { userId: admin.id, entity: name, entityId: id });
    return Response.json({ ok: true, message: "تم الحذف نهائيًا" });
  });
}
