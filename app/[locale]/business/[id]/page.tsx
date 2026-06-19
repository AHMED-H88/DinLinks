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
import type { ServiceItem } from "@/components/BusinessForm";
import BranchesSection from "@/components/BranchesSection";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://dinlinks.no";

// ── Dynamic metadata ──────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const b = await prisma.business.findUnique({
    where:   { id, status: "APPROVED" },
    include: { category: true },
  });
  if (!b) return { title: "Business not found | DinLinks" };

  const title = `${b.name} — ${b.category?.name ?? "Business"} in ${b.city ?? "Norway"} | DinLinks`;
  const description =
    b.description?.slice(0, 155) ??
    `${b.name} is a verified business on DinLinks. Find contact details, opening hours, and reviews.`;
  const ogImage = b.coverImage ?? b.logo ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/business/${id}` },
    openGraph: {
      title,
      description,
      type:   "website",
      url:    `${SITE_URL}/en/business/${id}`,
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

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const session = await auth();
  const { id, locale } = await params;

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

  // Increment view counter (fire-and-forget, never blocks render)
  prisma.business.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

  let isFavorite = false;
  if (session?.user?.id) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_businessId: { userId: session.user.id, businessId: id } },
    });
    isFavorite = !!fav;
  }

  const openingHours = (business.openingHours ?? {}) as Record<string, any>;
  const services     = Array.isArray(business.services)
    ? (business.services as unknown as ServiceItem[])
    : [];

  const DAY_LABELS: Record<string, string> = {
    monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
  };

  const allImages = [
    ...(business.coverImage ? [business.coverImage] : []),
    ...business.images,
  ];

  const isNo = locale === "no";
  const branches = business.branches ?? [];

  const navItems = [
    { id: "about",    label: isNo ? "Om bedriften"  : "About" },
    ...(allImages.length   > 0 ? [{ id: "photos",   label: isNo ? "Bilder"        : "Photos" }]          : []),
    ...(services.length    > 0 ? [{ id: "services",  label: isNo ? "Tjenester"     : "Services" }]        : []),
    ...(Object.keys(openingHours).length > 0 ? [{ id: "hours", label: isNo ? "Åpningstider" : "Opening hours" }] : []),
    { id: "contact",  label: isNo ? "Kontakt"       : "Contact" },
    ...(business.address   ? [{ id: "location", label: isNo ? "Beliggenhet"   : "Location" }]             : []),
    ...(branches.length    > 0 ? [{ id: "branches", label: isNo ? "Filialer"      : "Branches" }]         : []),
    { id: "reviews",  label: isNo ? "Anmeldelser"   : "Reviews" },
  ];

  // ── JSON-LD — LocalBusiness structured data ───────────────────────────────
  const avgRating = business.reviews.length
    ? business.reviews.reduce((s, r) => s + r.rating, 0) / business.reviews.length
    : null;

  const openingHoursSpec = Object.entries(openingHours)
    .filter(([, h]: [string, any]) => !h?.closed)
    .map(([day, h]: [string, any]) => ({
      "@type":     "OpeningHoursSpecification",
      dayOfWeek:   `https://schema.org/${day.charAt(0).toUpperCase() + day.slice(1)}`,
      opens:       h?.open  ?? "09:00",
      closes:      h?.close ?? "17:00",
    }));

  const jsonLd: Record<string, any> = {
    "@context":   "https://schema.org",
    "@type":      "LocalBusiness",
    name:          business.name         ?? undefined,
    description:   business.description  ?? undefined,
    url:          `${SITE_URL}/en/business/${business.id}`,
    telephone:     business.phone        ?? undefined,
    email:         business.email        ?? undefined,
    ...(business.website ? { sameAs: [business.website] } : {}),
    ...(business.logo    ? { image: business.logo }        : {}),
    address: business.address ? {
      "@type":          "PostalAddress",
      streetAddress:     business.address,
      addressLocality:   business.city       ?? undefined,
      postalCode:        business.postalCode  ?? undefined,
      addressCountry:   "NO",
    } : undefined,
    ...(openingHoursSpec.length ? { openingHoursSpecification: openingHoursSpec } : {}),
    ...(avgRating != null ? {
      aggregateRating: {
        "@type":       "AggregateRating",
        ratingValue:    avgRating.toFixed(1),
        reviewCount:    business.reviews.length,
        bestRating:    "5",
        worstRating:   "1",
      },
    } : {}),
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div className="mb-10">
          {/* Cover image */}
          {business.coverImage && (
            <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 relative bg-gray-100">
              <Image
                src={business.coverImage}
                alt={`${business.name} cover`}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 overflow-hidden border-2 border-white shadow-medium bg-gray-100 flex items-center justify-center -mt-2">
              {business.logo ? (
                <Image src={business.logo} alt={business.name ?? ""} width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-gray-400">
                  {(business.name ?? "?").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {business.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {isNo ? "Verifisert" : "Verified"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {business.category && (
                  <span className="font-medium text-gray-700">{business.category.name}</span>
                )}
                {business.city && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {business.city}
                    </span>
                  </>
                )}
                {branches.length > 0 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                      {branches.length} {isNo ? (branches.length === 1 ? "filial" : "filialer") : (branches.length === 1 ? "branch" : "branches")}
                    </span>
                  </>
                )}
                {business._count.favorites > 0 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{business._count.favorites} {isNo ? "favoritter" : "favourites"}</span>
                  </>
                )}
              </div>
            </div>

            {/* Favourite button */}
            {session?.user && (
              <div className="flex-shrink-0">
                <FavoriteButton businessId={business.id} initialIsFavorite={isFavorite} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── Sticky sidebar nav ────────────────────────────────────── */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <nav className="sticky top-24 space-y-0.5">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  {item.label}
                </a>
              ))}

              {/* Action buttons in sidebar */}
              <div className="pt-4 space-y-2">
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Visit website
                  </a>
                )}
                {business.bookingLink && (
                  <a
                    href={business.bookingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Book now
                  </a>
                )}
              </div>
            </nav>
          </aside>

          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-12">

            {/* About */}
            <section id="about" className="scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
              {business.description ? (
                <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                  {business.description.split("\n").map((p, i) => (
                    <p key={i} className="mb-3">{p}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No description provided.</p>
              )}
            </section>

            {/* Photos */}
            {allImages.length > 0 && (
              <section id="photos" className="scroll-mt-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Photos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allImages.map((img, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                      <Image src={img} alt={`Photo ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <section id="services" className="scroll-mt-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Services &amp; offers</h2>
                <div className="space-y-3">
                  {services.map((svc) => (
                    <div key={svc.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{svc.name}</h3>
                        {svc.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{svc.description}</p>
                        )}
                      </div>
                      {svc.price && (
                        <span className="flex-shrink-0 text-sm font-semibold text-gray-900 bg-white border border-gray-200 px-3 py-1 rounded-lg">
                          {svc.price}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Opening hours */}
            {Object.keys(openingHours).length > 0 && (
              <section id="hours" className="scroll-mt-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Opening hours</h2>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {Object.entries(openingHours).map(([day, h]: [string, any], i) => (
                    <div
                      key={day}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700 w-28">
                        {DAY_LABELS[day] ?? day}
                      </span>
                      {h?.closed ? (
                        <span className="text-sm text-gray-400">Closed</span>
                      ) : (
                        <span className="text-sm text-gray-800 font-medium">
                          {h?.open} – {h?.close}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contact */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contact</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{business.phone}</p>
                    </div>
                  </a>
                )}

                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">{business.email}</p>
                    </div>
                  </a>
                )}
              </div>

              {/* CTA links */}
              {(business.website || business.bookingLink) && (
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Visit website
                    </a>
                  )}
                  {business.bookingLink && (
                    <a
                      href={business.bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-5 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Book now
                    </a>
                  )}
                </div>
              )}
            </section>

            {/* Location */}
            {(business.address || business.city) && (
              <section id="location" className="scroll-mt-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
                <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <div>
                    {business.address && <p className="text-sm font-medium text-gray-900">{business.address}</p>}
                    {(business.city || business.postalCode) && (
                      <p className="text-sm text-gray-500">
                        {[business.postalCode, business.city].filter(Boolean).join(" ")}
                      </p>
                    )}
                    {business.mapLink && (
                      <a
                        href={business.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
                      >
                        Open in Maps
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Branches */}
            {branches.length > 0 && (
              <BranchesSection branches={branches as any} locale={locale} />
            )}

            {/* Reviews */}
            <section id="reviews" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                <span className="text-sm text-gray-400">
                  {business.reviews.length} {business.reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>

              {session?.user && session.user.id !== business.userId && (
                <div className="mb-6">
                  <ReviewForm businessId={business.id} />
                </div>
              )}

              {!session?.user && (
                <div className="mb-6 p-4 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500">
                  <a href="/login" className="font-medium text-gray-900 underline">Sign in</a> to leave a review.
                </div>
              )}

              <ReviewList reviews={business.reviews} />
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
