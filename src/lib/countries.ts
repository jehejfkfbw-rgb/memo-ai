/**
 * الدول المدعومة في منصة نبراس: مصر، السعودية، الأردن، الإمارات فقط.
 * كل ما يتعلق بالبلد (التسجيل، العملة، رمز الاتصال، التحقق من الجوال) يمرّ من هنا.
 */

export const SUPPORTED_COUNTRY_CODES = ["EG", "SA", "JO", "AE"] as const;
export type CountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];

export type Country = {
  code: CountryCode;
  nameAr: string;
  nameEn: string;
  dial: string;
  currency: string;
  currencyAr: string;
  timezone: string;
  accent: string;
  phoneExample: string;
  /** أرقام الجوال الوطنية بعد رمز الاتصال */
  nationalDigits: number;
  phonePattern: RegExp;
};

export const COUNTRIES: Record<CountryCode, Country> = {
  EG: {
    code: "EG", nameAr: "مصر", nameEn: "Egypt", dial: "+20",
    currency: "EGP", currencyAr: "ج.م", timezone: "Africa/Cairo", accent: "#B4472E",
    phoneExample: "010 1234 5678", nationalDigits: 10,
    phonePattern: /^(?:\+?20)?1[0125]\d{8}$/,
  },
  SA: {
    code: "SA", nameAr: "السعودية", nameEn: "Saudi Arabia", dial: "+966",
    currency: "SAR", currencyAr: "ر.س", timezone: "Asia/Riyadh", accent: "#1F8A5F",
    phoneExample: "051 234 5678", nationalDigits: 9,
    phonePattern: /^(?:\+?966)?5\d{8}$/,
  },
  JO: {
    code: "JO", nameAr: "الأردن", nameEn: "Jordan", dial: "+962",
    currency: "JOD", currencyAr: "د.أ", timezone: "Asia/Amman", accent: "#7A3E9D",
    phoneExample: "079 123 4567", nationalDigits: 9,
    phonePattern: /^(?:\+?962)?7[5789]\d{7}$/,
  },
  AE: {
    code: "AE", nameAr: "الإمارات", nameEn: "United Arab Emirates", dial: "+971",
    currency: "AED", currencyAr: "د.إ", timezone: "Asia/Dubai", accent: "#1B3A6B",
    phoneExample: "050 123 4567", nationalDigits: 9,
    phonePattern: /^(?:\+?971)?5\d{8}$/,
  },
};

export const COUNTRY_LIST: Country[] = SUPPORTED_COUNTRY_CODES.map((code) => COUNTRIES[code]);

export const COUNTRY_COOKIE = "nebras_country";
export const DEFAULT_COUNTRY: CountryCode = "EG";

export const SUPPORTED_COUNTRIES_LABEL = COUNTRY_LIST.map((c) => c.nameAr).join(" · ");

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(value);
}

export function getCountry(code?: string | null): Country {
  return isCountryCode(code) ? COUNTRIES[code] : COUNTRIES[DEFAULT_COUNTRY];
}

export function countryOptions(): Array<{ value: CountryCode; label: string }> {
  return COUNTRY_LIST.map((c) => ({ value: c.code, label: `${c.nameAr} (${c.dial})` }));
}

/** تنسيق السعر بعملة الدولة المختارة */
export function formatPrice(amount: number, code?: string | null): string {
  const country = getCountry(code);
  if (!amount || amount <= 0) return "مجاني";
  const value = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(amount);
  return `${value} ${country.currencyAr}`;
}

/** تنظيف رقم الجوال إلى أرقام فقط */
export function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** التحقق من رقم الجوال حسب قواعد كل دولة مدعومة */
export function isValidPhone(phone: string, code?: string | null): boolean {
  const country = getCountry(code);
  const cleaned = phone.trim();
  if (!cleaned) return false;
  if (country.phonePattern.test(cleaned)) return true;

  // صيغة محلية مختصرة: ٠ + الرقم الوطني
  const digits = digitsOnly(cleaned);
  const dialDigits = digitsOnly(country.dial);
  const withoutDial = digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits;
  if (withoutDial.length === country.nationalDigits) return true;
  if (withoutDial.startsWith("0") && withoutDial.length === country.nationalDigits + 1) return true;
  return false;
}

/** توحيد رقم الجوال إلى الصيغة الدولية: ‎+20 10 1234 5678 */
export function normalizePhone(phone: string, code?: string | null): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const country = getCountry(code);
  const digits = digitsOnly(trimmed);
  const dialDigits = digitsOnly(country.dial);
  let national = digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits;
  if (national.startsWith("0")) national = national.slice(1);
  if (national.length < 7) return trimmed;
  return `${country.dial}${national}`;
}

export function phonePlaceholder(code?: string | null): string {
  return getCountry(code).phoneExample;
}

/** خريطة المدن المزروعة إلى الدول المدعومة (تُستخدم في التهيئة الرجعية) */
export const CITY_TO_COUNTRY: Record<string, CountryCode> = {
  "القاهرة": "EG", "الجيزة": "EG", "الإسكندرية": "EG", "المنصورة": "EG", "أسيوط": "EG",
  "الرياض": "SA", "جدة": "SA", "الدمام": "SA", "مكة": "SA", "المدينة": "SA",
  "عمان": "JO", "الزرقاء": "JO", "إربد": "JO",
  "دبي": "AE", "أبوظبي": "AE", "الشارقة": "AE",
};

export function countryFromCity(city?: string | null): CountryCode | null {
  if (!city) return null;
  const key = city.trim();
  if (CITY_TO_COUNTRY[key]) return CITY_TO_COUNTRY[key];
  const match = Object.keys(CITY_TO_COUNTRY).find((c) => key.includes(c));
  return match ? CITY_TO_COUNTRY[match] : null;
}
