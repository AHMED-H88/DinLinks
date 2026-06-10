import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import AuthSessionProvider from "@/components/SessionProvider";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL  = process.env.NEXTAUTH_URL ?? "https://dinlinks.no";
const SITE_NAME = "DinLinks";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  "DinLinks — Norway's Business Directory",
    template: "%s | DinLinks",
  },
  description:
    "Find verified local businesses in Norway. Accurate opening hours, contact details, reviews, and more — all in one place.",
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
    locale:      "en_US",
    url:          SITE_URL,
    siteName:     SITE_NAME,
    title:       "DinLinks — Norway's Business Directory",
    description: "Find verified local businesses in Norway with accurate contact info, opening hours, and customer reviews.",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "DinLinks — Norway's Business Directory",
    description: "Find verified local businesses in Norway.",
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
