import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import BusinessForm from "@/components/BusinessForm";

export const dynamic = "force-dynamic";

export default async function DashboardBusinessProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { userId: session!.user!.id },
    include: { category: true, branches: { orderBy: [{ isMainBranch: "desc" }, { name: "asc" }] } },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, parentId: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {business ? t("editProfile") : t("createProfile")}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {business ? t("editSubtitle") : t("createSubtitle")}
        </p>
      </div>

      <BusinessForm
          business={
            business
              ? {
                  id:           business.id,
                  userId:       business.userId,
                  name:         business.name,
                  description:  business.description,
                  categoryId:   business.categoryId,
                  logo:         business.logo,
                  coverImage:   business.coverImage,
                  images:       business.images,
                  services:     business.services as any,
                  address:      business.address,
                  city:         business.city,
                  postalCode:   business.postalCode,
                  latitude:     business.latitude,
                  longitude:    business.longitude,
                  phone:        business.phone,
                  email:        business.email,
                  website:      business.website,
                  bookingLink:  business.bookingLink,
                  mapLink:      business.mapLink,
                  openingHours: business.openingHours,
                  status:       business.status,
                  companyStory:       business.companyStory,
                  identitySummaryNo:  business.identitySummaryNo,
                  identitySummaryEn:  business.identitySummaryEn,
                  foundedYear:        business.foundedYear,
                  companySize:        business.companySize,
                  employeeCount:      business.employeeCount,
                  serviceModes:       business.serviceModes,
                  organizationNumber: business.organizationNumber,
                  legalName:          business.legalName,
                  organizationType:   business.organizationType,
                  highlightCodes:     business.highlightCodes,
                }
              : null
          }
          categories={categories}
        />
    </div>
  );
}
