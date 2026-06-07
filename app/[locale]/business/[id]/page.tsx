import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoriteButton from "@/components/FavoriteButton";
import ReviewList from "@/components/ReviewList";

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
  });

  if (!business || business.status !== "APPROVED") {
    notFound();
  }

  await prisma.business.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  let isFavorite = false;
  if (session?.user?.id) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId: id,
        },
      },
    });
    isFavorite = !!favorite;
  }

  const openingHours = business.openingHours as any;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Header with Name */}
        <div className="mb-12">
          <div className="flex items-center gap-6">
            {business.logo && (
              <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                <Image
                  src={business.logo!}
                  alt={business.name ?? ""}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                {business.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                  {business.category?.name || "Uncategorized"}
                </span>
                {business.address && (
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.45-1.015 2.37-1.945 1.901-1.92 4.264-5.32 4.264-9.406 0-4.418-3.582-8-8-8s-8 3.582-8 8c0 4.086 2.363 7.486 4.263 9.406.92.93 1.75 1.56 2.37 1.945.311.192.571.337.757.433.094.048.17.086.224.114.027.013.049.025.066.033.009.004.015.007.018.008l.006.003zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {business.address}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-auto">
              {session?.user && (
                <FavoriteButton
                  businessId={business.id}
                  initialIsFavorite={isFavorite}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {[
                { id: "om", label: "Om" },
                ...(business.images && business.images.length > 0 ? [{ id: "bilder", label: "Bilder" }] : []),
                { id: "apningstider", label: "Åpningstider" },
                { id: "kontakt", label: "Kontakt informasjon" },
                { id: "adresse", label: "Adresse" },
                { id: "lenker", label: "Links" },
                { id: "anmeldelser", label: "Anmeldelser" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block px-4 py-3 text-lg font-medium text-gray-500 hover:text-black transition-colors border-l-2 border-transparent hover:border-black"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Images Section (Top of main content) */}
            {business.images && business.images.length > 0 && (
              <div id="bilder" className="mb-16 scroll-mt-24">
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                  {business.images.map((image, index) => (
                    <div key={index} className="flex-shrink-0 snap-center first:pl-0">
                      <div className="relative h-[400px] w-[600px] rounded-2xl overflow-hidden bg-gray-100">
                        <Image
                          src={image}
                          alt={`${business.name} image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About Section */}
            <section id="om" className="mb-16 scroll-mt-24 max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Om</h2>
              <div className="text-lg leading-relaxed text-gray-800">
                {business.description?.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
                {!business.description && <p className="text-gray-400 italic">Ingen beskrivelse tilgjengelig.</p>}
              </div>
            </section>

            {/* Key People / Nøkkel folk (Placeholder if needed, derived from requirements image, but putting existing data here first) */}
            {/* Using Opening Hours here as per list order */}
            <section id="apningstider" className="mb-16 scroll-mt-24 max-w-sm">
              <h2 className="text-xl font-bold mb-4">Åpningstider</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-3">
                  {Object.entries(openingHours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-900 capitalize w-24">{day}</span>
                      <span className="text-gray-600">
                        {hours.closed ? "Stengt" : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section id="kontakt" className="mb-16 scroll-mt-24 max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Kontakt informasjon</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {business.phone && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Telefon</span>
                    <a href={`tel:${business.phone}`} className="text-lg font-medium hover:underline">
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.email && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">E-post</span>
                    <a href={`mailto:${business.email}`} className="text-lg font-medium hover:underline break-all">
                      {business.email}
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Address Section */}
            <section id="adresse" className="mb-16 scroll-mt-24 max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Adresse</h2>
              <p className="text-lg text-gray-800 mb-4">{business.address}</p>
              {business.mapLink && (
                <a
                  href={business.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-black font-medium border-b border-black pb-0.5 hover:opacity-70 transition-opacity"
                >
                  <span>Vis på kart</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              )}
            </section>

            {/* Links Section */}
            {(business.website || business.bookingLink) && (
              <section id="lenker" className="mb-16 scroll-mt-24 max-w-2xl">
                <h2 className="text-xl font-bold mb-4">Links</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-center"
                    >
                      Besøk nettside
                    </a>
                  )}
                  {business.bookingLink && (
                    <a
                      href={business.bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                    >
                      Bestill nå
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <section id="anmeldelser" className="scroll-mt-24">
              <h2 className="text-xl font-bold mb-6">Anmeldelser</h2>
              <ReviewList reviews={business.reviews} />
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
