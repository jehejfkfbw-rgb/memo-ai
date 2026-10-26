import { cookies } from "next/headers";
import { z } from "zod";
import { readJson, safeRoute } from "@/lib/http";
import { COUNTRIES, COUNTRY_COOKIE, SUPPORTED_COUNTRY_CODES, SUPPORTED_COUNTRIES_LABEL, type CountryCode } from "@/lib/countries";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.enum(SUPPORTED_COUNTRY_CODES as unknown as [CountryCode, ...CountryCode[]], {
    errorMap: () => ({ message: `الدولة غير مدعومة — المتاحة: ${SUPPORTED_COUNTRIES_LABEL}` }),
  }),
});

/** POST /api/country — اختيار الدولة (مصر/السعودية/الأردن/الإمارات) للزوار: يضبط كوكي العملة ورمز الاتصال */
export async function POST(req: Request) {
  return safeRoute(async () => {
    const body = schema.parse(await readJson(req));
    const store = await cookies();
    store.set(COUNTRY_COOKIE, body.code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    const country = COUNTRIES[body.code];
    return Response.json({
      ok: true,
      message: `تم ضبط الدولة على ${country.nameAr}`,
      data: { code: country.code, currency: country.currencyAr, dial: country.dial },
    });
  });
}

/** DELETE /api/country — إعادة التعيين إلى الدولة الافتراضية */
export async function DELETE() {
  return safeRoute(async () => {
    const store = await cookies();
    store.delete(COUNTRY_COOKIE);
    return Response.json({ ok: true, message: "تمت إعادة تعيين الدولة" });
  });
}
