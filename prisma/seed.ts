import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TOP_LEVELS, SUBCATEGORIES } from "../lib/taxonomy-v1";

const prisma = new PrismaClient();

/** Shortest password any seeded account will accept. One rule, both of them. */
const SEED_PASSWORD_MIN = 8;

/**
 * Read a password the caller must supply, or explain what is missing.
 *
 * No default, and no fallback: a password written in this file is a password
 * everyone with the repository has, and a seed pointed at a live database turns
 * it into a working login. The value is returned to be hashed and then dropped
 * — it is never logged, and neither is its length.
 */
function requireSeedPassword(varName: string): string {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`${varName} must be set (no default password is built in).`);
  }
  if (value.length < SEED_PASSWORD_MIN) {
    throw new Error(`${varName} must be at least ${SEED_PASSWORD_MIN} characters.`);
  }
  return value;
}

/**
 * Create the local ADMIN account — only when asked, and only with a credential
 * supplied from outside the repository.
 *
 * This used to hash a password written in this file and upsert an ADMIN on every
 * `db:seed`. A password in source is a password everyone with the repository
 * has, and a seed pointed at a live database turns it into a working key to
 * the admin surface. Nothing in the run said it had happened.
 *
 * Now: no environment variables, no admin. Both must be present, so a partial
 * setup stops the run instead of quietly falling back to a default. An account
 * that already exists is never touched — a seed must not reset a live
 * administrator's password. The password is read, hashed and dropped; it is
 * never logged, and neither is its length.
 */
async function seedAdmin() {
  const email    = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email && !password) {
    console.log("Admin user skipped (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one).");
    return;
  }

  // Half-configured is an accident, not an intention. Refuse rather than guess.
  if (!email || !password) {
    throw new Error(
      "Admin seeding needs BOTH SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD. " +
        `Missing: ${!email ? "SEED_ADMIN_EMAIL" : "SEED_ADMIN_PASSWORD"}.`
    );
  }

  // Re-read through the shared helper so the length rule is stated in one place.
  const adminPassword = requireSeedPassword("SEED_ADMIN_PASSWORD");

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.log("Admin user already exists — left unchanged (no password reset).");
    return;
  }

  await prisma.user.create({
    data: {
      email,
      // Same algorithm and cost factor the application uses. Unchanged.
      password: await bcrypt.hash(adminPassword, 10),
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Admin user created.");
}

async function main() {
  console.log("Starting database seed...");

  await seedAdmin();

  // ── Taxonomy v1 (docs/specifications/03_TAXONOMY_MASTER_LIST.md) ─────────────
  // Idempotent, slug-keyed upserts. Parents (top-level Categories) are created
  // before children (Subcategories). No `annet`, no `generelt`. Kafe uses slug
  // `cafe`. Existing approved slugs are never renamed.
  const topIdBySlug = new Map<string, string>();
  for (const top of TOP_LEVELS) {
    const row = await prisma.category.upsert({
      where: { slug: top.slug },
      update: { name: top.no, parentId: null },
      create: { name: top.no, slug: top.slug },
    });
    topIdBySlug.set(top.slug, row.id);
  }

  const subIdBySlug = new Map<string, string>();
  for (const sub of SUBCATEGORIES) {
    const parentId = topIdBySlug.get(sub.parent);
    if (!parentId) throw new Error(`Seed: missing parent ${sub.parent} for ${sub.slug}`);
    const row = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.no, parentId },
      create: { name: sub.no, slug: sub.slug, parentId },
    });
    subIdBySlug.set(sub.slug, row.id);
  }

  console.log(`Taxonomy v1 created: ${TOP_LEVELS.length} top-level, ${SUBCATEGORIES.length} subcategories`);

  // ── Demo businesses ────────────────────────────────────────────────────────
  // Opt-in, and off by default. These three are APPROVED, which is what puts a
  // business into public discovery — the homepage, Search and the category
  // pages. They carry real company names DinLinks does not represent, owner
  // accounts on the reserved example.com domain and stock photography, so a
  // seed run against a live database publishes three profiles that look like
  // listings and are not. Local development sets SEED_DEMO_BUSINESSES=1.
  //
  // This guards future runs only. It does not remove rows an earlier run
  // already created — see the launch-readiness report.
  if (process.env.SEED_DEMO_BUSINESSES !== "1") {
    console.log("Demo businesses skipped (set SEED_DEMO_BUSINESSES=1 to create them).");
    console.log("Seed completed successfully!");
    return;
  }

  // The demo owners' password is supplied too, for the same reason the admin's
  // is. These three accounts are real logins — maaemo@example.com and its two
  // siblings exist in databases an earlier seed ran against — so a shared
  // literal here is a shared key to them. Opting in with SEED_DEMO_BUSINESSES
  // is unchanged; it now also means choosing what the accounts are secured with.
  const businessUserPassword = await bcrypt.hash(
    requireSeedPassword("SEED_DEMO_PASSWORD"),
    10
  );

  // Demo businesses are assigned to Subcategories (never a top-level Category).
  const restaurantCat = { id: subIdBySlug.get("restaurant")! };
  const servicesCat = { id: subIdBySlug.get("frisor")! };
  const shoppingCat = { id: subIdBySlug.get("elektronikk")! };

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
