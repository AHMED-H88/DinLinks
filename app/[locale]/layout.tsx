import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import AuthSessionProvider from "@/components/SessionProvider";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL  = process.env.NEXTAUTH_URL ?? "https://dinlinks.no";
const SITE_NAME = "DinLinks";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "layout" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default:  t("metaTitle"),
      template: "%s | DinLinks",
    },
    description: t("metaDescription"),
    keywords: [
      "Norwegian business directory",
      "local businesses Norway",
      "finn bedrifter",
      "bedriftskatalog Norge",
      "DinLinks",
    ],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    openGraph: {
      type:        "website",
      locale:      locale === "no" ? "nb_NO" : "en_GB",
      url:          SITE_URL,
      siteName:     SITE_NAME,
      title:       t("ogTitle"),
      description: t("ogDescription"),
    },
    twitter: {
      card:        "summary_large_image",
      title:       t("ogTitle"),
      description: t("twitterDescription"),
      creator:     "@dinlinks",
    },
    robots: {
      index:           true,
      follow:          true,
      googleBot: {
        index:          true,
        follow:         true,
        "max-image-preview": "large",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "no")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
