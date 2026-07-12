import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoriteButton from "@/components/FavoriteButton";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import BranchesSection from "@/components/BranchesSection";
import ProfileGallery from "@/components/ProfileGallery";
import ProfileShareButton from "@/components/ProfileShareButton";
import type { ServiceItem } from "@/components/BusinessForm";
import type { Branch } from "@/components/BranchManager";
import { getTranslations } from "next-intl/server";
import { normalizeDayKey } from "@/lib/days";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://dinlinks.no";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Index openingHours by canonical English day key, tolerating Norwegian keys. */
function normalizeOpeningHours(openingHours: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [raw, value] of Object.entries(openingHours)) {
    const key = normalizeDayKey(raw);
    if (key) out[key] = value;
  }
  return out;
}

function isOpenNow(openingHours: Record<string, any>): boolean {
  const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Oslo" }));
  const day  = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()];
  const h    = normalizeOpeningHours(openingHours)[day];
  if (!h || h.closed) return false;
  const [oh, om] = (h.open  ?? "00:00").split(":").map(Number);
  const [ch, cm] = (h.close ?? "00:00").split(":").map(Number);
  const cur  = now.getHours() * 60 + now.getMinutes();
  return cur >= oh * 60 + om && cur < ch * 60 + cm;
}

function avgRatingOf(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });

  const b = await prisma.business.findUnique({
    where:   { id, status: "APPROVED" },
    include: { category: true, reviews: { select: { rating: true } } },
  });
  if (!b) return { title: t("meta.notFound") };

  const rating    = avgRatingOf(b.reviews);
  const ratingStr = rating ? ` · ${rating.toFixed(1)}⭐` : "";
  const title     = `${b.name} — ${b.category?.name ?? t("meta.categoryFallback")} ${t("meta.inPreposition")} ${b.city ?? t("meta.locationFallback")}${ratingStr} | DinLinks`;

  const description =
    b.description?.slice(0, 155) ??
    t("meta.descriptionFallback", { name: b.name ?? "" });

  const ogImage = b.coverImage ?? b.logo ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/business/${id}` },
    openGraph: {
      title, description,
      type: "website",
      url:  `${SITE_URL}/${locale}/business/${id}`,
      siteName: "DinLinks",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: b.name ?? "" }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title, description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const session        = await auth();
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  const tCat = await getTranslations({ locale, namespace: "categories" });

  const DAY_LABELS: Record<string, string> = {
    monday:    t("days.monday"),
    tuesday:   t("days.tuesday"),
    wednesday: t("days.wednesday"),
    thursday:  t("days.thursday"),
    friday:    t("days.friday"),
    saturday:  t("days.saturday"),
    sunday:    t("days.sunday"),
  };
  const isNo           = locale === "no";

  // ── Data ──────────────────────────────────────────────────────────────────
  const business = await prisma.business.findUnique({
    where:   { id },
    include: {
      category: true,
      reviews:  { orderBy: { createdAt: "desc" }, take: 20 },
      branches: { orderBy: [{ isMainBranch: "desc" }, { name: "asc" }] },
      _count:   { select: { favorites: true } },
    },
  });

  if (!business || business.status !== "APPROVED") notFound();

  // Fire-and-forget view increment
  prisma.business.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

  // Favourite state
  let isFavorite = false;
  if (session?.user?.id) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_businessId: { userId: session.user.id, businessId: id } },
    });
    isFavorite = !!fav;
  }

  // Similar businesses (same category, not this one, approved, max 3)
  const similarBusinesses = business.categoryId
    ? await prisma.business.findMany({
        where:   { categoryId: business.categoryId, id: { not: id }, status: "APPROVED" },
        include: { category: true, reviews: { select: { rating: true } } },
        orderBy: { views: "desc" },
        take:    3,
      })
    : [];

  // ── Derived ───────────────────────────────────────────────────────────────
  const openingHours  = (business.openingHours ?? {}) as Record<string, any>;
  const services      = Array.isArray(business.services)
    ? (business.services as unknown as ServiceItem[])
    : [];
  const branches      = (business.branches ?? []) as unknown as Branch[];
  const galleryImages = business.images;
  const avgRating     = avgRatingOf(business.reviews);
  const hasHours      = Object.keys(openingHours).length > 0;
  const openNow       = hasHours ? isOpenNow(openingHours) : null;
  const profileUrl    = `${SITE_URL}/${locale}/business/${id}`;

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  const openingHoursSpec = Object.entries(openingHours)
    .filter(([, h]: [string, any]) => !h?.closed)
    .map(([day, h]: [string, any]) => ({
      "@type":   "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${day.charAt(0).toUpperCase() + day.slice(1)}`,
      opens:     h?.open  ?? "09:00",
      closes:    h?.close ?? "17:00",
    }));

  const jsonLd: Record<string, any> = {
    "@context":  "https://schema.org",
    "@type":     "LocalBusiness",
    name:         business.name        ?? undefined,
    description:  business.description ?? undefined,
    url:         `${SITE_URL}/${locale}/business/${id}`,
    telephone:    business.phone       ?? undefined,
    email:        business.email       ?? undefined,
    ...(business.website ? { sameAs: [business.website] } : {}),
    ...(business.logo    ? { image:  business.logo }       : {}),
    address: business.address ? {
      "@type":        "PostalAddress",
      streetAddress:   business.address,
      addressLocality: business.city       ?? undefined,
      postalCode:      business.postalCode ?? undefined,
      addressCountry: "NO",
    } : undefined,
    ...(openingHoursSpec.length ? { openingHoursSpecification: openingHoursSpec } : {}),
    ...(avgRating != null ? {
      aggregateRating: {
        "@type":      "AggregateRating",
        ratingValue:   avgRating.toFixed(1),
        reviewCount:   business.reviews.length,
        bestRating:   "5",
        worstRating:  "1",
      },
    } : {}),
    ...(business.latitude && business.longitude ? {
      geo: { "@type": "GeoCoordinates", latitude: business.latitude, longitude: business.longitude },
    } : {}),
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main>
        {/* ══════════════════════════════════════════════════════════════════
            HERO — full-bleed cover with identity overlay at bottom
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative w-full h-72 sm:h-80 md:h-[28rem] overflow-hidden bg-gray-900">
          {/* Cover image */}
          {business.coverImage ? (
            <Image
              src={business.coverImage}
              alt={`${business.name} forsidebilde`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            // Elegant gradient fallback — no generic placeholder
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #1d4ed8 100%)",
              }}
            />
          )}

          {/* Gradient veil — bottom-heavy so text is always legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

          {/* ── Identity block — overlaid at the bottom of the cover ── */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-6 pt-20">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end gap-4 sm:gap-5">

                {/* Logo */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/30 bg-white shadow-large flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {business.logo ? (
                    <Image
                      src={business.logo}
                      alt={business.name ?? ""}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary-600 select-none">
                      {(business.name ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0 pb-0.5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight drop-shadow">
                      {business.name}
                    </h1>

                    {/* Verified */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/90 text-white border border-emerald-400/40 backdrop-blur-sm">
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t("hero.verified")}
                    </span>

                    {/* Open / Closed */}
                    {openNow !== null && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-sm ${
                        openNow
                          ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                          : "bg-red-500/20 text-red-200 border-red-400/30"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                        {openNow ? (t("hero.openNow")) : (t("hero.closedNow"))}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {business.category && (
                      <span className="text-sm text-white/80 font-medium">{tCat.has(business.category.slug) ? tCat(business.category.slug) : business.category.name}</span>
                    )}
                    {business.city && (
                      <span className="flex items-center gap-1 text-sm text-white/60">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {business.city}
                      </span>
                    )}
                    {avgRating !== null && (
                      <span className="flex items-center gap-1 text-sm text-white/70">
                        <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold text-white/90">{avgRating.toFixed(1)}</span>
                        <span className="text-white/50">({business.reviews.length})</span>
                      </span>
                    )}
                    {branches.length > 0 && (
                      <span className="flex items-center gap-1 text-sm text-white/60">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                        {branches.length} {branches.length === 1 ? t("hero.branchSingular") : t("hero.branchPlural")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Favourite — desktop only (shows above overlay) */}
                {session?.user && (
                  <div className="hidden sm:block flex-shrink-0 pb-0.5">
                    <FavoriteButton businessId={business.id} initialIsFavorite={isFavorite} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action bar — below the hero, white strip ──────────────────── */}
        <div className="bg-white border-b border-gray-100 shadow-subtle">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">

              {/* Primary CTA — Book */}
              {business.bookingLink && (
                <a
                  href={business.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-soft flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  {t("actions.bookNow")}
                </a>
              )}

              {/* Call */}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {t("actions.call")}
                </a>
              )}

              {/* Website */}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 01.284-2.253" />
                  </svg>
                  {t("actions.website")}
                </a>
              )}

              {/* Directions */}
              {(business.address || business.city || (business.latitude && business.longitude)) && (
                <a
                  href={
                    business.latitude && business.longitude
                      ? `https://www.google.com/maps?q=${business.latitude},${business.longitude}`
                      : `https://www.google.com/maps/search/${encodeURIComponent(
                          [business.address, business.postalCode, business.city].filter(Boolean).join(", ")
                        )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  {t("actions.directions")}
                </a>
              )}

              {/* Share */}
              <ProfileShareButton
                title={business.name ?? "DinLinks"}
                url={profileUrl}
                label={t("actions.share")}
                labelCopied={t("actions.copied")}
              />

              {/* Favourite — mobile */}
              {session?.user && (
                <div className="sm:hidden ml-auto flex-shrink-0">
                  <FavoriteButton businessId={business.id} initialIsFavorite={isFavorite} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN — two-column layout: content (left) + sidebar (right)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-7 items-start">

            {/* ── Left: main content ──────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-10">

              {/* ── Om bedriften ──────────────────────────────────────── */}
              <section id="about" className="scroll-mt-24">
                <SectionHeading>{t("sections.about")}</SectionHeading>
                {business.description ? (
                  <div className="text-gray-700 leading-relaxed text-[0.9375rem] space-y-3">
                    {business.description.split("\n").map((p, i) =>
                      p.trim() ? <p key={i}>{p}</p> : null
                    )}
                  </div>
                ) : (
                  <EmptyState>
                    {t("about.empty")}
                  </EmptyState>
                )}
              </section>

              {/* ── Bilder ────────────────────────────────────────────── */}
              {galleryImages.length > 0 && (
                <ProfileGallery
                  images={galleryImages}
                  businessName={business.name ?? ""}
                />
              )}

              {/* ── Tjenester ─────────────────────────────────────────── */}
              {services.length > 0 && (
                <section id="services" className="scroll-mt-24">
                  <SectionHeading>{t("sections.services")}</SectionHeading>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {services.map((svc) => (
                      <div
                        key={svc.id}
                        className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-subtle"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{svc.name}</p>
                          {svc.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{svc.description}</p>
                          )}
                        </div>
                        {svc.price && (
                          <span className="flex-shrink-0 text-sm font-semibold text-primary-700 bg-primary-50 border border-primary-100 px-3 py-1 rounded-lg">
                            {svc.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Filialer ──────────────────────────────────────────── */}
              {branches.length > 0 && (
                <BranchesSection branches={branches} locale={locale} />
              )}

              {/* ── Anmeldelser ───────────────────────────────────────── */}
              <section id="reviews" className="scroll-mt-24">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <SectionHeading className="mb-0">
                      {t("sections.reviews")}
                    </SectionHeading>
                    {avgRating !== null && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <svg
                              key={n}
                              className={`w-4 h-4 ${n <= Math.round(avgRating) ? "text-amber-400" : "text-gray-200"}`}
                              viewBox="0 0 20 20" fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                        <span className="text-sm text-gray-400">
                          · {business.reviews.length} {t("reviews.reviewPlural")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {session?.user && session.user.id !== business.userId && (
                  <div className="mb-8">
                    <ReviewForm businessId={business.id} />
                  </div>
                )}

                {!session?.user && (
                  <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 shadow-subtle">
                    <a href={`/${locale}/login`} className="font-semibold text-primary-600 hover:text-primary-700">
                      {t("reviews.signIn")}
                    </a>{" "}
                    {t("reviews.signInToReview")}
                  </div>
                )}

                {business.reviews.length === 0 ? (
                  <div className="py-14 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-500">
                      {t("reviews.noReviews")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("reviews.beFirst")}
                    </p>
                  </div>
                ) : (
                  <ReviewList reviews={business.reviews} locale={locale} />
                )}
              </section>

              {/* ── Lignende bedrifter ────────────────────────────────── */}
              {similarBusinesses.length > 0 && (
                <section id="similar" className="scroll-mt-24">
                  <SectionHeading>{t("sections.similar")}</SectionHeading>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {similarBusinesses.map((sb) => {
                      const sbRating = avgRatingOf(sb.reviews);
                      return (
                        <Link
                          key={sb.id}
                          href={`/${locale}/business/${sb.id}`}
                          className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-subtle hover:border-primary-200 hover:shadow-soft transition-all duration-200 overflow-hidden"
                        >
                          {/* Mini cover */}
                          <div className="relative h-28 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                            {sb.coverImage ? (
                              <Image
                                src={sb.coverImage}
                                alt={sb.name ?? ""}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200" />
                            )}
                            {/* Logo badge */}
                            <div className="absolute bottom-2 left-3 w-9 h-9 rounded-xl border-2 border-white bg-white shadow-subtle overflow-hidden flex items-center justify-center">
                              {sb.logo ? (
                                <Image src={sb.logo} alt={sb.name ?? ""} width={36} height={36} className="object-cover w-full h-full" />
                              ) : (
                                <span className="text-xs font-bold text-primary-600">
                                  {(sb.name ?? "?").slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-3.5 flex-1">
                            <p className="font-semibold text-gray-900 text-sm group-hover:text-primary-700 transition-colors leading-snug mb-1">
                              {sb.name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {sb.city && (
                                <span className="text-xs text-gray-400">{sb.city}</span>
                              )}
                              {sbRating !== null && (
                                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                  <svg className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {sbRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

            </div>{/* /main content */}

            {/* ── Right: sticky sidebar ───────────────────────────────── */}
            <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-24">

              {/* ── Contact card ────────────────────────────────────── */}
              <div id="contact" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white shadow-subtle overflow-hidden">
                <CardHeader>{t("sidebar.contact")}</CardHeader>
                <div className="divide-y divide-gray-100">
                  {business.phone && (
                    <ContactRow
                      href={`tel:${business.phone}`}
                      label={t("sidebar.phone")}
                      value={business.phone}
                      icon={
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      }
                    />
                  )}
                  {business.email && (
                    <ContactRow
                      href={`mailto:${business.email}`}
                      label={t("sidebar.email")}
                      value={business.email}
                      truncate
                      icon={
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      }
                    />
                  )}
                  {business.website && (
                    <ContactRow
                      href={business.website}
                      external
                      label={t("actions.website")}
                      value={business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      truncate
                      icon={
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 01.284-2.253" />
                      }
                    />
                  )}
                </div>
                {(business.website || business.bookingLink) && (
                  <div className="px-4 py-3.5 border-t border-gray-100 space-y-2">
                    {business.bookingLink && (
                      <a
                        href={business.bookingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                      >
                        {t("actions.bookNow")}
                      </a>
                    )}
                    {business.website && (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {t("sidebar.visitWebsite")}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* ── Åpningstider card ────────────────────────────────── */}
              {hasHours && (
                <div id="hours" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white shadow-subtle overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <CardHeaderText>{t("sidebar.openingHours")}</CardHeaderText>
                    {openNow !== null && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        openNow
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                        {openNow ? (t("sidebar.open")) : (t("sidebar.closed"))}
                      </span>
                    )}
                  </div>
                  <div>
                    {Object.entries(openingHours).map(([day, h]: [string, any], i) => {
                      const dayKey = normalizeDayKey(day);
                      return (
                      <div
                        key={day}
                        className={`flex items-center justify-between px-4 py-2.5 ${i % 2 === 0 ? "bg-gray-50/60" : "bg-white"}`}
                      >
                        <span className="text-xs font-medium text-gray-600">{dayKey ? DAY_LABELS[dayKey] : day}</span>
                        {h?.closed ? (
                          <span className="text-xs text-gray-400">{t("sidebar.closed")}</span>
                        ) : (
                          <span className="text-xs text-gray-800 font-semibold tabular-nums">
                            {h?.open} – {h?.close}
                          </span>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Beliggenhet card ─────────────────────────────────── */}
              {(business.address || business.city) && (
                <div id="location" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white shadow-subtle overflow-hidden">
                  <CardHeader>{t("sidebar.location")}</CardHeader>
                  <a
                    href={
                      business.latitude && business.longitude
                        ? `https://www.google.com/maps?q=${business.latitude},${business.longitude}`
                        : `https://www.google.com/maps/search/${encodeURIComponent(
                            [business.address, business.postalCode, business.city].filter(Boolean).join(", ")
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      {business.address && (
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {business.address}
                        </p>
                      )}
                      {(business.city || business.postalCode) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[business.postalCode, business.city].filter(Boolean).join(" ")}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary-600">
                        {t("sidebar.openInMaps")}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </a>
                </div>
              )}

              {/* ── Om denne profilen card ───────────────────────────── */}
              <div id="trust" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white shadow-subtle overflow-hidden">
                <CardHeader>{t("sidebar.profileInfo")}</CardHeader>
                <div className="divide-y divide-gray-100">

                  <TrustRow
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    }
                    label={t("sidebar.verifiedBusiness")}
                    sub={t("sidebar.approvedBy")}
                  />

                  <TrustRow
                    iconBg="bg-amber-50"
                    iconColor="text-amber-500"
                    iconFilled
                    icon={
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    }
                    label={`${business.reviews.length} ${business.reviews.length === 1 ? t("reviews.reviewSingular") : t("reviews.reviewPlural")}${avgRating !== null ? ` · ${avgRating.toFixed(1)}/5` : ""}`}
                    sub={t("sidebar.genuineRatings")}
                  />

                  <TrustRow
                    iconBg="bg-gray-100"
                    iconColor="text-gray-500"
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    }
                    label={(business.views ?? 0).toLocaleString(isNo ? "nb-NO" : "en-GB")}
                    sub={t("sidebar.profileViews")}
                  />

                  <TrustRow
                    iconBg="bg-gray-100"
                    iconColor="text-gray-500"
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    }
                    label={new Date(business.updatedAt).toLocaleDateString(
                      isNo ? "nb-NO" : "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                    sub={t("sidebar.lastUpdated")}
                  />

                </div>
              </div>

            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─── Small render-only helpers (keep JSX DRY without new files) ───────────────

function SectionHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-base font-bold text-gray-900 mb-4 tracking-tight ${className}`}>
      {children}
    </h2>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5 border-b border-gray-100">
      <CardHeaderText>{children}</CardHeaderText>
    </div>
  );
}

function CardHeaderText({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-gray-900">{children}</h3>;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-gray-400 italic">{children}</p>
  );
}

function ContactRow({
  href,
  label,
  value,
  icon,
  external = false,
  truncate = false,
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  external?: boolean;
  truncate?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className={`text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors ${truncate ? "truncate" : ""}`}>
          {value}
        </p>
      </div>
    </a>
  );
}

function TrustRow({
  iconBg,
  iconColor,
  icon,
  label,
  sub,
  iconFilled = false,
}: {
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  iconFilled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <svg
          className={`w-4 h-4 ${iconColor}`}
          fill={iconFilled ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke={iconFilled ? "none" : "currentColor"}
        >
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </div>
  );
}
