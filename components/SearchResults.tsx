import { prisma } from "@/lib/prisma";
import BusinessCard from "@/components/BusinessCard";
import { calculateDistance } from "@/lib/utils";

interface SearchResultsProps {
  searchParams: {
    q?: string;
    category?: string;
    lat?: string;
    lng?: string;
  };
}

export default async function SearchResults({ searchParams }: SearchResultsProps) {
  const { q, category, lat, lng } = searchParams;

  const where: any = {
    status: "APPROVED",
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    const categoryData = await prisma.category.findUnique({
      where: { slug: category },
    });
    if (categoryData) {
      where.categoryId = categoryData.id;
    }
  }

  let businesses = await prisma.business.findMany({
    where,
    include: {
      category: true,
      _count: {
        select: {
          favorites: true,
          reviews: true,
        },
      },
    },
    orderBy: {
      views: "desc",
    },
  });

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    businesses = businesses
      .map((business) => ({
        ...business,
        distance: calculateDistance(
          userLat,
          userLng,
          business.latitude ?? 0,
          business.longitude ?? 0
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No businesses found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600">
          {businesses.length} {businesses.length === 1 ? "business" : "businesses"} found
        </p>
      </div>

      <div className="grid gap-6">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            id={business.id}
            name={business.name ?? ""}
            description={business.description ?? ""}
            category={business.category?.name ?? ""}
            city={business.city ?? ""}
            verified={business.status === "APPROVED"}
            logo={business.logo}
          />
        ))}
      </div>
    </div>
  );
}
