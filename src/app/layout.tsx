import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { bootstrap } from "@/lib/bootstrap";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: {
    default: "نبراس | NEBRAS — منصة تعليمية ذكية",
    template: "%s | نبراس",
  },
  description: "نبراس — نور المعرفة، طريق المستقبل. منصة تعليمية عربية متكاملة للمراحل الابتدائية والإعدادية والثانوية والجامعية: كورسات، دروس، اختبارات، نتائج، ومتابعة تقدم.",
  keywords: ["نبراس", "NEBRAS", "منصة تعليمية", "تعليم عربي", "كورسات", "اختبارات إلكترونية"],
  applicationName: "NEBRAS",
};

export const viewport: Viewport = {
  themeColor: "#1B3A6B",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // تهيئة المخطط والبيانات الأولية وقت التشغيل فقط (تُتخطى أثناء البناء)
  await bootstrap();

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-navy-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
