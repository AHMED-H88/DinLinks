import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
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

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://dinlinks.no";

// ─── Day label maps (shared throughout this file) ────────────────────────────

const DAYS_EN: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};
const DAYS_NO: Record<string, string> = {
  monday: "Mandag", tuesday: "Tirsdag", wednesday: "Onsdag",
  thursday: "Torsdag", friday: "Fredag", saturday: "Lørdag", sunday: "Søndag",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true when the business is currently open, based on local Oslo time. */
function isOpenNow(openingHours: Record<string, any>): boolean {
  const now   = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Oslo" }));
  const day   = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()];
  const hours = openingHours[day];
  if (!hours || hours.closed) return false;
  const [oh, om] = (hours.open  ?? "00:00").split(":").map(Number);
  const [ch, cm] = (hours.close ?? "00:00").split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= oh * 60 + om && cur < ch * 60 + cm;
}

function avgRatingOf(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const isNo = locale === "no";

  const b = await prisma.business.findUnique({
    where:   { id, status: "APPROVED" },
    include: { category: true, reviews: { select: { rating: true } } },
  });
  if (!b) return { title: "Business not found | DinLinks" };

  const rating = avgRatingOf(b.reviews);
  const ratingStr = rating ? ` · ${rating.toFixed(1)}⭐` : "";
  const title = isNo
    ? `${b.name} — ${b.category?.name ?? "Bedrift"} i ${b.city ?? "Norge"}${ratingStr} | DinLinks`
    : `${b.name} — ${b.category?.name ?? "Business"} in ${b.city ?? "Norway"}${ratingStr} | DinLinks`;

  const description =
    b.description?.slice(0, 155) ??
    (isNo
      ? `${b.name} er en verifisert bedrift på DinLinks. Finn kontaktinfo, åpningstider og anmeldelser.`
      : `${b.name} is a verified business on DinLinks. Find contact details, opening hours, and reviews.`);

  const ogImage = b.coverImage ?? b.logo ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/business/${id}` },
    openGraph: {
      title,
      description,
      type:     "website",
      url:      `${SITE_URL}/${locale}/business/${id}`,
      siteName: "DinLinks",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: b.name ?? "" }] } : {}),
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
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
  const session            = await auth();
  const { id, locale }     = await params;
  const isNo               = locale === "no";
  const DAY_LABELS         = isNo ? DAYS_NO : DAYS_EN;

  // ── Data ──────────────────────────────────────────────────────────────────
  const business = await prisma.business.findUnique({
    where: { id },
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

  let isFavorite = false;
  if (session?.user?.id) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_businessId: { userId: session.user.id, businessId: id } },
    });
    isFavorite = !!fav;
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const openingHours = (business.openingHours ?? {}) as Record<string, any>;
  const services     = Array.isArray(business.services)
    ? (business.services as unknown as ServiceItem[])
    : [];
  const branches     = (business.branches ?? []) as unknown as Branch[];
  const galleryImages = business.images; // cover excluded from gallery per spec
  const avgRating     = avgRatingOf(business.reviews);
  const hasHours      = Object.keys(openingHours).length > 0;
  const openNow       = hasHours ? isOpenNow(openingHours) : null;

  // ── Sidebar nav items (visible on desktop) ────────────────────────────────
  const navItems = [
    { id: "about",    label: isNo ? "Om bedriften"  : "About" },
    ...(galleryImages.length > 0 ? [{ id: "photos",   label: isNo ? "Bilder"        : "Photos" }]         : []),
    ...(services.length      > 0 ? [{ id: "services",  label: isNo ? "Tjenester"     : "Services" }]       : []),
    ...(hasHours               ? [{ id: "hours",    label: isNo ? "Åpningstider" : "Opening hours" }]    : []),
    { id: "contact",  label: isNo ? "Kontakt"       : "Contact" },
    ...(business.address       ? [{ id: "location",  label: isNo ? "Beliggenhet"   : "Location" }]        : []),
    ...(branches.length      > 0 ? [{ id: "branches", label: isNo ? "Filialer"      : "Branches" }]        : []),
    { id: "reviews",  label: isNo ? "Anmeldelser"   : "Reviews" },
    { id: "trust",    label: isNo ? "Om oss"         : "About us" },
  ];

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
    url:         `${SITE_URL}/${locale}/business/${business.id}`,
    telephone:    business.phone       ?? undefined,
    email:        business.email       ?? undefined,
    ...(business.website ? { sameAs: [business.website] } : {}),
    ...(business.logo    ? { image: business.logo }        : {}),
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
      geo: {
        "@type":    "GeoCoordinates",
        latitude:   business.latitude,
        longitude:  business.longitude,
      },
    } : {}),
  };

  const profileUrl = `${SITE_URL}/${locale}/business/${id}`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main>
        {/* ════════════════════════════════════════════════════════════════
            SECTION 1 — HERO
        ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white border-b border-gray-100">
          {/* Cover image */}
          <div className="relative w-full h-52 sm:h-72 md:h-80 bg-gradient-to-br from-primary-50 via-white to-gray-100 overflow-hidden">
            {business.coverImage ? (
              <Image
                src={business.coverImage}
                alt={`${business.name} cover`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-gray-100" />
            )}
            {/* Gradient overlay so text below is always readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
          </div>

          {/* Identity row */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-10 sm:-mt-14 mb-6 relative z-10">
              {/* Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-medium bg-white flex-shrink-0 overflow-hidden flex items-center justify-center">
                {business.logo ? (
                  <Image
                    src={business.logo}
                    alt={business.name ?? ""}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary-600">
                    {(business.name ?? "?").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                    {business.name}
                  </h1>
                  {/* Verified badge */}
                  <span className="badge-verified flex-shrink-0">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {isNo ? "Verifisert" : "Verified"}
                  </span>
                  {/* Open/Closed badge */}
                  {openNow !== null && (
                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      openNow
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
                      {openNow
                        ? (isNo ? "Åpent nå" : "Open now")
                        : (isNo ? "Stengt nå" : "Closed now")}
                    </span>
                  )}
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                  {business.category && (
                    <span className="font-medium text-gray-700">{business.category.name}</span>
                  )}
                  {business.city && (
                    <>
                      <span className="text-gray-300 hidden sm:inline">·</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {business.city}
                      </span>
                    </>
                  )}
                  {avgRating !== null && (
                    <>
                      <span className="text-gray-300 hidden sm:inline">·</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold text-gray-800">{avgRating.toFixed(1)}</span>
                        <span className="text-gray-400">({business.reviews.length} {isNo ? "anmeldelser" : "reviews"})</span>
                      </span>
                    </>
                  )}
                  {branches.length > 0 && (
                    <>
                      <span className="text-gray-300 hidden sm:inline">·</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                        {branches.length} {isNo ? (branches.length === 1 ? "filial" : "filialer") : (branches.length === 1 ? "branch" : "branches")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Favourite (desktop top-right) */}
              {session?.user && (
                <div className="hidden sm:block flex-shrink-0 pb-1">
                  <FavoriteButton businessId={business.id} initialIsFavorite={isFavorite} />
                </div>
              )}
            </div>

            {/* Quick-action buttons */}
            <div className="flex flex-wrap gap-2 pb-5">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-600 hover:text-gray-900 min-w-[64px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span className="text-[11px] font-medium leading-none">
                    {isNo ? "Ring" : "Call"}
                  </span>
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-600 hover:text-gray-900 min-w-[64px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 01.284-2.253" />
                  </svg>
                  <span className="text-[11px] font-medium leading-none">
                    {isNo ? "Nettsted" : "Website"}
                  </span>
                </a>
              )}
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
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-600 hover:text-gray-900 min-w-[64px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  <span className="text-[11px] font-medium leading-none">
                    {isNo ? "Veibeskrivelse" : "Directions"}
                  </span>
                </a>
              )}
              {business.bookingLink && (
                <a
                  href={business.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-all text-primary-700 min-w-[64px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="text-[11px] font-medium leading-none">
                    {isNo ? "Book nå" : "Book now"}
                  </span>
                </a>
              )}
              {/* Share button — client component */}
              <ProfileShareButton
                title={business.name ?? "DinLinks"}
                url={profileUrl}
                label={isNo ? "Del" : "Share"}
                labelCopied={isNo ? "Kopiert!" : "Copied!"}
              />
              {/* Favourite on mobile */}
              {session?.user && (
                <div className="sm:hidden">
                  <FavoriteButton businessId={business.id} initialIsFavorite={isFavorite} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MAIN LAYOUT — sidebar + content
        ════════════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── Sticky sidebar nav (desktop only) ──────────────────── */}
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <nav className="sticky top-24 space-y-0.5">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                  >
                    {item.label}
                  </a>
                ))}

                {/* CTA buttons in sidebar */}
                <div className="pt-5 space-y-2">
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                    >
                      {isNo ? "Besøk nettsted" : "Visit website"}
                    </a>
                  )}
                  {business.bookingLink && (
                    <a
                      href={business.bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      {isNo ? "Book nå" : "Book now"}
                    </a>
                  )}
                </div>
              </nav>
            </aside>

            {/* ── Main content column ─────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-12">

              {/* ══════════════════════════════════════════════════════════
                  SECTION 2 — ABOUT
              ══════════════════════════════════════════════════════════ */}
              <section id="about" className="scroll-mt-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {isNo ? "Om bedriften" : "About"}
                </h2>
                {business.description ? (
                  <div className="prose prose-sm prose-gray max-w-none text-gray-700 leading-relaxed">
                    {business.description.split("\n").map((p, i) => (
                      p.trim() && <p key={i} className="mb-3 last:mb-0">{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    {isNo ? "Ingen beskrivelse lagt til." : "No description provided."}
                  </p>
                )}
              </section>

              {/* ══════════════════════════════════════════════════════════
                  SECTION 4 — SERVICES
              ══════════════════════════════════════════════════════════ */}
              {services.length > 0 && (
                <section id="services" className="scroll-mt-24">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    {isNo ? "Tjenester og tilbud" : "Services & offers"}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {services.map((svc) => (
                      <div
                        key={svc.id}
                        className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-subtle"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm">{svc.name}</h3>
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

              {/* ══════════════════════════════════════════════════════════
                  SECTION 5 — GALLERY (client component for lightbox)
              ══════════════════════════════════════════════════════════ */}
              {galleryImages.length > 0 && (
                <ProfileGallery
                  images={galleryImages}
                  businessName={business.name ?? ""}
                  labelPhotos={isNo ? "Bilder" : "Photos"}
                  labelClose={isNo ? "Lukk" : "Close"}
                  labelPrev={isNo ? "Forrige" : "Previous"}
                  labelNext={isNo ? "Neste" : "Next"}
                />
              )}

              {/* ══════════════════════════════════════════════════════════
                  SECTION 6 — OPENING HOURS
              ══════════════════════════════════════════════════════════ */}
              {hasHours && (
                <section id="hours" className="scroll-mt-24">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      {isNo ? "Åpningstider" : "Opening hours"}
                    </h2>
                    {openNow !== null && (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        openNow
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
                        {openNow ? (isNo ? "Åpent nå" : "Open now") : (isNo ? "Stengt nå" : "Closed now")}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-subtle">
                    {Object.entries(openingHours).map(([day, h]: [string, any], i) => (
                      <div
                        key={day}
                        className={`flex items-center justify-between px-4 py-3 ${
                          i % 2 === 0 ? "bg-gray-50/60" : "bg-white"
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-700 w-28">
                          {DAY_LABELS[day] ?? day}
                        </span>
                        {h?.closed ? (
                          <span className="text-sm text-gray-400">
                            {isNo ? "Stengt" : "Closed"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-800 font-medium tabular-nums">
                            {h?.open} – {h?.close}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ══════════════════════════════════════════════════════════
                  SECTION 6 — CONTACT
              ══════════════════════════════════════════════════════════ */}
              <section id="contact" className="scroll-mt-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {isNo ? "Kontaktinformasjon" : "Contact information"}
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-subtle hover:border-primary-200 hover:shadow-soft transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">{isNo ? "Telefon" : "Phone"}</p>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {business.phone}
                        </p>
                      </div>
                    </a>
                  )}

                  {business.email && (
                    <a
                      href={`mailto:${business.email}`}
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-subtle hover:border-primary-200 hover:shadow-soft transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">{isNo ? "E-post" : "Email"}</p>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
                          {business.email}
                        </p>
                      </div>
                    </a>
                  )}

                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-subtle hover:border-primary-200 hover:shadow-soft transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 01.284-2.253" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">{isNo ? "Nettsted" : "Website"}</p>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
                          {business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </p>
                      </div>
                    </a>
                  )}

                  {business.bookingLink && (
                    <a
                      href={business.bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-primary-100 bg-primary-50 shadow-subtle hover:border-primary-200 hover:shadow-soft transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-primary-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-primary-600 font-medium">{isNo ? "Bestilling" : "Booking"}</p>
                        <p className="text-sm font-semibold text-primary-700">
                          {isNo ? "Book en time" : "Book an appointment"}
                        </p>
                      </div>
                    </a>
                  )}
                </div>

                {/* CTA buttons */}
                {(business.website || business.bookingLink) && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    {business.website && (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                      >
                        {isNo ? "Besøk nettsted" : "Visit website"}
                      </a>
                    )}
                    {business.bookingLink && (
                      <a
                        href={business.bookingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-5 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {isNo ? "Book nå" : "Book now"}
                      </a>
                    )}
                  </div>
                )}
              </section>

              {/* ══════════════════════════════════════════════════════════
                  SECTION 7 — LOCATION
              ══════════════════════════════════════════════════════════ */}
              {(business.address || business.city) && (
                <section id="location" className="scroll-mt-24">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    {isNo ? "Beliggenhet" : "Location"}
                  </h2>
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
                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-subtle hover:border-primary-200 hover:shadow-soft transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      {business.address && (
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {business.address}
                        </p>
                      )}
                      {(business.city || business.postalCode) && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {[business.postalCode, business.city].filter(Boolean).join(" ")}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary-600 group-hover:text-primary-700">
                        {isNo ? "Åpne i kart" : "Open in Maps"}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </a>
                </section>
              )}

              {/* ══════════════════════════════════════════════════════════
                  SECTION 3 — BRANCHES (reuses BranchesSection component)
              ══════════════════════════════════════════════════════════ */}
              {branches.length > 0 && (
                <BranchesSection branches={branches} locale={locale} />
              )}

              {/* ══════════════════════════════════════════════════════════
                  SECTION 7 — REVIEWS
              ══════════════════════════════════════════════════════════ */}
              <section id="reviews" className="scroll-mt-24">
                {/* Header with aggregate rating */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {isNo ? "Anmeldelser" : "Reviews"}
                    </h2>
                    {avgRating !== null && (
                      <div className="flex items-center gap-2 mt-1">
                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <svg
                              key={n}
                              className={`w-4 h-4 ${n <= Math.round(avgRating) ? "text-amber-400" : "text-gray-200"}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                        <span className="text-sm text-gray-400">
                          ({business.reviews.length} {isNo ? "anmeldelser" : "reviews"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Write review form */}
                {session?.user && session.user.id !== business.userId && (
                  <div className="mb-8">
                    <ReviewForm businessId={business.id} />
                  </div>
                )}

                {/* Sign-in prompt */}
                {!session?.user && (
                  <div className="mb-8 p-4 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500">
                    <a href={`/${locale}/login`} className="font-semibold text-primary-600 hover:text-primary-700">
                      {isNo ? "Logg inn" : "Sign in"}
                    </a>{" "}
                    {isNo ? "for å skrive en anmeldelse." : "to leave a review."}
                  </div>
                )}

                {/* Empty state */}
                {business.reviews.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-gray-100 bg-gray-50">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-500">
                      {isNo ? "Ingen anmeldelser ennå." : "No reviews yet."}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isNo ? "Vær den første til å skrive en anmeldelse." : "Be the first to leave a review."}
                    </p>
                  </div>
                ) : (
                  <ReviewList reviews={business.reviews} />
                )}
              </section>

              {/* ══════════════════════════════════════════════════════════
                  SECTION 8 — TRUST SIGNALS
              ══════════════════════════════════════════════════════════ */}
              <section id="trust" className="scroll-mt-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {isNo ? "Om denne profilen" : "About this profile"}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Verified */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-green-100 bg-green-50">
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-800">
                        {isNo ? "Verifisert" : "Verified"}
                      </p>
                      <p className="text-[11px] text-green-700">
                        {isNo ? "Godkjent bedrift" : "Approved business"}
                      </p>
                    </div>
                  </div>

                  {/* Reviews count */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-800">
                        {business.reviews.length} {isNo ? "anmeldelser" : "reviews"}
                      </p>
                      <p className="text-[11px] text-amber-700">
                        {avgRating !== null
                          ? `${avgRating.toFixed(1)} / 5.0 ${isNo ? "snitt" : "avg"}`
                          : (isNo ? "Ingen anmeldelser" : "No reviews yet")}
                      </p>
                    </div>
                  </div>

                  {/* Branches */}
                  {branches.length > 0 && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-primary-100 bg-primary-50">
                      <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary-800">
                          {branches.length} {isNo ? (branches.length === 1 ? "filial" : "filialer") : (branches.length === 1 ? "branch" : "branches")}
                        </p>
                        <p className="text-[11px] text-primary-700">
                          {isNo ? "Lokasjoner" : "Locations"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  {business.category && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-subtle">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{business.category.name}</p>
                        <p className="text-[11px] text-gray-500">{isNo ? "Kategori" : "Category"}</p>
                      </div>
                    </div>
                  )}

                  {/* Last updated */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-subtle">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        {new Date(business.updatedAt).toLocaleDateString(
                          isNo ? "nb-NO" : "en-GB",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {isNo ? "Sist oppdatert" : "Last updated"}
                      </p>
                    </div>
                  </div>

                  {/* Profile views */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-subtle">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        {(business.views ?? 0).toLocaleString(isNo ? "nb-NO" : "en-GB")}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {isNo ? "Profilvisninger" : "Profile views"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

            </div>{/* /main content */}
          </div>{/* /flex layout */}
        </div>{/* /container */}
      </main>

      <Footer />
    </div>
  );
}
