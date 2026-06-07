import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dinlinks.com" },
    update: {},
    create: {
      email: "admin@dinlinks.com",
      password: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Admin user created:", admin.email);

  const categories = [
    { name: "Administrasjon", slug: "administrasjon" },
    { name: "Helse", slug: "helse" },
    { name: "Håndverk", slug: "handverk" },
    { name: "Annet", slug: "annet" },
    { name: "Restaurant", slug: "restaurant" },
    { name: "Cafe", slug: "cafe" },
    { name: "Shopping", slug: "shopping" },
    { name: "Tjenester", slug: "tjenester" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("Categories created");

  const businessUserPassword = await bcrypt.hash("business123", 10);

  // Fetch categories to get IDs
  const restaurantCat = await prisma.category.findUnique({ where: { slug: "restaurant" } });
  const servicesCat = await prisma.category.findUnique({ where: { slug: "tjenester" } });
  const shoppingCat = await prisma.category.findUnique({ where: { slug: "shopping" } });

  // 1. Maaemo
  const maaemoOwner = await prisma.user.upsert({
    where: { email: "maaemo@example.com" },
    update: {},
    create: {
      email: "maaemo@example.com",
      password: businessUserPassword,
      name: "Maaemo Owner",
      role: "BUSINESS",
    },
  });

  if (restaurantCat) {
    await prisma.business.upsert({
      where: { userId: maaemoOwner.id },
      update: {},
      create: {
        userId: maaemoOwner.id,
        name: "Maaemo",
        description: "Maaemo er en norsk restaurant som ligger i Dronning Eufemias gate 23 i Bjørvika i Oslo. Fra 2010 til 2019 lå den ved Annette Thommessens plass langs Schweigaards gate. Den åpnet i 2010 og baserer seg på kortreist mat med utgangspunkt i tilgjengelige råvarer. Kjøkkensjefen er danske Esben Holmboe Bang.",
        categoryId: restaurantCat.id,
        status: "APPROVED",
        address: "Dronning Eufemias gate 23, 0191 Oslo",
        phone: "+47 22 17 99 69",
        email: "booking@maaemo.no",
        website: "https://maaemo.no",
        bookingLink: "https://maaemo.no/booking",
        mapLink: "https://maps.google.com/?q=Maaemo,Oslo",
        images: [
          "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop",
        ],
        logo: "https://images.unsplash.com/photo-1466978913421-dad938661248?q=80&w=200&auto=format&fit=crop",
        openingHours: {
          mandag: { closed: true },
          tirsdag: { open: "18:00", close: "23:00" },
          onsdag: { open: "18:00", close: "23:00" },
          torsdag: { open: "18:00", close: "23:00" },
          fredag: { open: "18:00", close: "23:00" },
          lørdag: { open: "12:00", close: "23:00" },
          søndag: { closed: true },
        },
      },
    });
  }

  // 2. Cutters
  const cuttersOwner = await prisma.user.upsert({
    where: { email: "cutters@example.com" },
    update: {},
    create: {
      email: "cutters@example.com",
      password: businessUserPassword,
      name: "Cutters Owner",
      role: "BUSINESS",
    },
  });

  if (servicesCat) {
    await prisma.business.upsert({
      where: { userId: cuttersOwner.id },
      update: {},
      create: {
        userId: cuttersOwner.id,
        name: "Cutters Storo",
        description: "Cutters er et nytt og unikt frisørkonsept som bygger på effektivitet, kvalitet og en fast pris uavhengig av kjønn og type klipp. Vi tilbyr drop-in timer og du kan se ventetid i sanntid på våre nettsider eller i appen.",
        categoryId: servicesCat.id,
        status: "APPROVED",
        address: "Vitaminveien 7, 0485 Oslo",
        phone: "+47 22 22 22 22",
        email: "kontakt@cutters.no",
        website: "https://cutters.no",
        mapLink: "https://maps.google.com/?q=Cutters+Storo",
        images: [
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1521590832169-7dad1a99d523?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1503951914875-befea74701c5?q=80&w=800&auto=format&fit=crop",
        ],
        logo: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=200&auto=format&fit=crop",
        openingHours: {
          mandag: { open: "10:00", close: "21:00" },
          tirsdag: { open: "10:00", close: "21:00" },
          onsdag: { open: "10:00", close: "21:00" },
          torsdag: { open: "10:00", close: "21:00" },
          fredag: { open: "10:00", close: "21:00" },
          lørdag: { open: "10:00", close: "19:00" },
          søndag: { closed: true },
        },
      },
    });
  }

  // 3. Elkjøp
  const elkjopOwner = await prisma.user.upsert({
    where: { email: "elkjop@example.com" },
    update: {},
    create: {
      email: "elkjop@example.com",
      password: businessUserPassword,
      name: "Elkjøp Owner",
      role: "BUSINESS",
    },
  });

  if (shoppingCat) {
    await prisma.business.upsert({
      where: { userId: elkjopOwner.id },
      update: {},
      create: {
        userId: elkjopOwner.id,
        name: "Elkjøp Ullevål",
        description: "Elkjøp er Nordens største handelsforetak innen forbrukerelektronikk og elektriske husholdningsapparater. Hos oss finner du et stort utvalg av kjente merkevarer til lave priser. Vi tilbyr også tjenester som levering, installasjon og support.",
        categoryId: shoppingCat.id,
        status: "APPROVED",
        address: "Sognsveien 75C, 0855 Oslo",
        phone: "+47 21 00 21 21",
        email: "kundeservice@elkjop.no",
        website: "https://elkjop.no",
        mapLink: "https://maps.google.com/?q=Elkjøp+Ullevål",
        images: [
          "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?q=80&w=800&auto=format&fit=crop",
        ],
        logo: "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?q=80&w=200&auto=format&fit=crop",
        openingHours: {
          mandag: { open: "09:00", close: "20:00" },
          tirsdag: { open: "09:00", close: "20:00" },
          onsdag: { open: "09:00", close: "20:00" },
          torsdag: { open: "09:00", close: "20:00" },
          fredag: { open: "09:00", close: "20:00" },
          lørdag: { open: "10:00", close: "18:00" },
          søndag: { closed: true },
        },
      },
    });
  }

  console.log("Example businesses created");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
