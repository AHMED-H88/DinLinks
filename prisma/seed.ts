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

/**
 * Outreach demo profiles — three fictional example businesses.
 *
 * Separate from SEED_DEMO_BUSINESSES on purpose. That flag creates the older
 * development fixtures, which carry real company names and are indistinguishable
 * from listings. These three are a different thing: fictional companies, flagged
 * `isDemo`, meant to be opened from a link in outreach email so a business owner
 * can see what a DinLinks profile looks like.
 *
 * `isDemo: true` is what keeps them out of the homepage, Search, the category
 * pages and every count derived from them, out of search-engine indexing, and
 * closed to reviews. `status: "APPROVED"` is still required — it is what makes
 * /business/<id> resolve at all.
 *
 * The ids are written explicitly rather than left to cuid() so the outreach URLs
 * are permanent and readable, and survive a reseed:
 *
 *   /no/business/demo-ror-og-bad
 *   /no/business/demo-harstudio
 *   /no/business/demo-bakeri-og-kafe
 *
 * The three demos carry approved copy and NO media. Cover, logo and gallery are
 * uploaded by hand through the Business editor once the demos exist, so no
 * unapproved or unattributed imagery is committed to the repository or shipped
 * in the deployed bundle. The seed preserves whatever is uploaded from then on. All data is fictional:
 * phone numbers begin 00, which no Norwegian subscriber number can; email and
 * web addresses use the reserved `.example` TLD (RFC 2606), which cannot be
 * registered; streets are invented. No organisation number is set, and nothing
 * here presents a demo as verified.
 */
async function seedOutreachDemos(subIdBySlug: Map<string, string>) {
  if (process.env.SEED_OUTREACH_DEMOS !== "1") {
    console.log("Outreach demos skipped (set SEED_OUTREACH_DEMOS=1 to create them).");
    return;
  }

  // These owner rows are real logins, so the credential comes from outside the
  // repository — the same rule the admin and the development demos follow.
  const ownerPassword = await bcrypt.hash(
    requireSeedPassword("SEED_OUTREACH_DEMOS_PASSWORD"),
    10
  );

  // Opt in to discarding hand-managed cover and gallery images. Off by default:
  // the common case is re-running the seed for a copy change, and that must not
  // cost the media someone curated in the editor.
  const resetMedia = process.env.SEED_OUTREACH_DEMOS_RESET_MEDIA === "1";
  console.log(
    resetMedia
      ? "Outreach demos: SEED_OUTREACH_DEMOS_RESET_MEDIA=1 — cover and gallery will be reset to the seed values."
      : "Outreach demos: existing cover and gallery images are preserved (set SEED_OUTREACH_DEMOS_RESET_MEDIA=1 to reset them)."
  );

  const HOURS_WEEKDAY = {
    monday:    { open: "08:00", close: "16:00" },
    tuesday:   { open: "08:00", close: "16:00" },
    wednesday: { open: "08:00", close: "16:00" },
    thursday:  { open: "08:00", close: "16:00" },
    friday:    { open: "08:00", close: "15:00" },
    saturday:  { closed: true },
    sunday:    { closed: true },
  };

  const demos = [
    // ── Demo 1 — FINAL CONTENT (approved content pass) ──────────────────────
    // `description`, `companyStory` and every ServiceItem string are
    // single-language columns, so the Norwegian text below is what both locales
    // render. Only identitySummaryNo/En is a localized pair. See the content
    // report: no localization system was invented for the rest.
    //
    // `images` remain UNAPPROVED placeholders — final media is supplied later.
    {
      id: "demo-ror-og-bad",
      subcategory: "rorlegger",
      ownerEmail: "demo-ror-og-bad@example.com",
      name: "Eksempel Rør og Bad AS",
      identitySummaryNo:
        "Rørleggerfirma for service, bad, varme og mindre oppussingsprosjekter.",
      identitySummaryEn:
        "Plumbing company for service, bathrooms, heating and smaller renovation projects.",
      description:
        "Eksempel Rør og Bad AS er en fiktiv bedrift laget for å vise hvordan en bedriftsprofil på DinLinks kan brukes.\n\n" +
        "Bedriften illustrerer et lokalt rørleggerfirma som utfører serviceoppdrag, arbeid på bad, utskifting av sanitærutstyr og mindre prosjekter innen vann og varme.\n\n" +
        "Profilen viser hvordan viktig informasjon om en bedrift kan samles og presenteres på en ryddig måte før kunden tar kontakt.",
      companyStory:
        "Eksempel Rør og Bad AS ble etablert i 2018 med mål om å tilby praktiske rørleggertjenester til boligeiere og mindre næringskunder.\n\n" +
        "Bedriften tar både mindre serviceoppdrag og planlagte prosjekter, og arbeider blant annet med bad, sanitærutstyr, vanninstallasjoner og varmeløsninger.\n\n" +
        "Dette er en fiktiv bedrift. Innholdet er laget for å demonstrere hvordan en virksomhet kan presentere mer enn bare navn og kontaktinformasjon på DinLinks.",
      foundedYear: 2018,
      // Two, from the fixed HIGHLIGHT_CODES list. Deliberately restrained: the
      // demo is meant to look like a believable local business, not to show off
      // how many badges the field supports. EMERGENCY_SERVICE and
      // WEEKEND_SERVICE are excluded on principle — no emergency or 24-hour
      // claim, and a weekend badge would contradict the closed Saturday and
      // Sunday in the opening hours below.
      highlightCodes: ["FREE_ESTIMATE", "MOBILE_SERVICE"],
      // Eksempelveien has zero registered addresses in Norway (verified against
      // Kartverket's address register), so this street does not exist. The
      // postal code is the real Lørenskog one, which keeps the address readable
      // without naming a real premises.
      email: "kontakt@rorogbad.eksempel.example",
      website: "https://rorogbad.eksempel.example",
      address: "Eksempelveien 12",
      postalCode: "1470",
      city: "Lørenskog",
      // No prices: none were supplied, and inventing NOK figures would put a
      // fabricated number on a profile shown to real plumbers.
      services: [
        { name: "Rørleggerservice",   description: "Hjelp med mindre rørleggeroppdrag, feil, lekkasjer og utskifting av deler i bolig.",      price: "", priceMode: "NONE" },
        { name: "Bad",                description: "Rørarbeid ved oppussing og oppgradering av bad, inkludert tilkobling av sanitærutstyr.",  price: "", priceMode: "NONE" },
        { name: "Servant og toalett", description: "Montering og utskifting av servant, toalett, blandebatteri og annet sanitærutstyr.",      price: "", priceMode: "NONE" },
        { name: "Vann og avløp",      description: "Arbeid med vannledninger, avløp og mindre endringer i eksisterende installasjoner.",      price: "", priceMode: "NONE" },
        { name: "Varme",              description: "Montering og service på vannbårne varmeløsninger og tilhørende installasjoner.",          price: "", priceMode: "NONE" },
        { name: "Feilsøking",         description: "Undersøkelse av problemer med vann, trykk, lekkasjer eller andre rørinstallasjoner.",     price: "", priceMode: "NONE" },
      ],
      openingHours: HOURS_WEEKDAY,
      // ── Media: intentionally empty ──────────────────────────────────────
      // The demo ships with no cover and no gallery. Unapproved placeholder
      // imagery is not carried in the repository or the deployed bundle, and an
      // asset URL that no longer resolves would render as a failure rather than
      // as "no media yet".
      //
      // Both states are already handled: an absent cover falls back to the hero
      // gradient, and an empty gallery drops the Photos section and its nav
      // entry rather than showing an empty frame.
      //
      // Final cover, logo and gallery are uploaded through the Business editor
      // once the demos exist in Production. From that point the seed preserves
      // them — media is written only on first create, or on an explicit
      // SEED_OUTREACH_DEMOS_RESET_MEDIA=1, which would blank these again.
      images: [],
    },
    // ── Demo 2 — FINAL CONTENT (approved content pass) ──────────────────────
    // A direct-to-consumer personal service, deliberately shaped unlike Demo 1:
    // published prices, a booking action, a closed weekday and a late evening.
    //
    // Prices are written as complete display strings ("fra 690 kr") because the
    // public profile prints `price` verbatim — priceMode is stored but read by
    // no UI, and its only effect is that a price survives normalisation solely
    // under FIXED or FROM (lib/business-fields.ts). Hence FROM on every row.
    //
    // `images` are UNAPPROVED placeholders for render verification only. Final
    // cover, logo and gallery are uploaded through the Business editor, and the
    // seed preserves them from then on.
    {
      id: "demo-harstudio",
      subcategory: "frisor",
      ownerEmail: "demo-harstudio@example.com",
      name: "Eksempel Hårstudio AS",
      identitySummaryNo:
        "Frisørsalong for klipp, farge og styling til dame, herre og barn.",
      identitySummaryEn:
        "Hair salon for cuts, colour and styling for women, men and children.",
      description:
        "Eksempel Hårstudio AS er en fiktiv bedrift laget for å vise hvordan en bedriftsprofil på DinLinks kan brukes.\n\n" +
        "Bedriften illustrerer en lokal frisørsalong som tilbyr klipp, farge, styling og enklere hårbehandlinger for voksne og barn. Salongen tar imot timeavtaler og enkelte drop-in-timer.\n\n" +
        "Profilen viser hvordan priser, tjenester og åpningstider kan presenteres samlet, slik at kunden vet hva de kan forvente før de bestiller time.",
      companyStory:
        "Eksempel Hårstudio AS ble etablert i 2016 og drives som en liten, lokal salong med noen få faste frisører.\n\n" +
        "Salongen jobber mest med klipp, farge og styling, og tar imot både faste kunder og nye kunder som bestiller time.\n\n" +
        "Dette er en fiktiv bedrift. Innholdet er laget for å demonstrere hvordan en virksomhet kan presentere mer enn bare navn og kontaktinformasjon på DinLinks.",
      foundedYear: 2016,
      // Two, and both consistent with the data below: the salon opens Saturday,
      // so Helgeåpent is not a claim the opening hours contradict.
      highlightCodes: ["FAMILY_OWNED", "WEEKEND_SERVICE"],
      // Eksempelgata has zero registered addresses in Norway (verified against
      // Kartverket); 2000 is the real Lillestrøm postal code.
      email: "kontakt@harstudio.eksempel.example",
      website: "https://harstudio.eksempel.example",
      address: "Eksempelgata 3",
      postalCode: "2000",
      city: "Lillestrøm",
      // Booking is the primary customer action for a salon, so this demo
      // exercises the existing hero CTA. Fictional URL on a reserved TLD.
      bookingLink: "https://harstudio.eksempel.example/booking",
      services: [
        { name: "Klipp, dame",      description: "Klipp, vask og enkel føning.",                        price: "fra 690 kr",   priceMode: "FROM" },
        { name: "Klipp, herre",     description: "Klipp og vask, med kort behandlingstid.",              price: "fra 490 kr",   priceMode: "FROM" },
        { name: "Klipp, barn",      description: "Klipp for barn under 12 år.",                          price: "fra 350 kr",   priceMode: "FROM" },
        { name: "Farge",            description: "Helfarge eller bunnfarge, med vask og føning.",        price: "fra 1 290 kr", priceMode: "FROM" },
        { name: "Striper og folie", description: "Striper i deler av håret eller full folie.",           price: "fra 1 690 kr", priceMode: "FROM" },
        { name: "Styling",          description: "Føning og styling til fest og andre anledninger.",     price: "fra 590 kr",   priceMode: "FROM" },
      ],
      // Closed Monday, late Thursday, open Saturday — a shape Demo 1's uniform
      // weekday block never exercises.
      openingHours: {
        monday:    { closed: true },
        tuesday:   { open: "10:00", close: "18:00" },
        wednesday: { open: "10:00", close: "18:00" },
        thursday:  { open: "10:00", close: "20:00" },
        friday:    { open: "10:00", close: "18:00" },
        saturday:  { open: "10:00", close: "16:00" },
        sunday:    { closed: true },
      },
      // ── Media: intentionally empty ──────────────────────────────────────
      // The demo ships with no cover and no gallery. Unapproved placeholder
      // imagery is not carried in the repository or the deployed bundle, and an
      // asset URL that no longer resolves would render as a failure rather than
      // as "no media yet".
      //
      // Both states are already handled: an absent cover falls back to the hero
      // gradient, and an empty gallery drops the Photos section and its nav
      // entry rather than showing an empty frame.
      //
      // Final cover, logo and gallery are uploaded through the Business editor
      // once the demos exist in Production. From that point the seed preserves
      // them — media is written only on first create, or on an explicit
      // SEED_OUTREACH_DEMOS_RESET_MEDIA=1, which would blank these again.
      images: [],
    },
    // ── Demo 3 — FINAL CONTENT (approved content pass) ──────────────────────
    // Food and hospitality, shaped unlike either of the others: open seven days
    // from early morning, a mix of priced and unpriced rows, and NO bookingLink
    // — a walk-in bakery takes no bookings, so the hero CTA is meant to be
    // absent here. That absence is the point: the same profile shows the button
    // where it belongs (Demo 2) and hides it where it does not.
    //
    // The taxonomy allows exactly one Subcategory, so this is filed under
    // Bakeri and the cafe half is carried by the identity summary.
    //
    // `images` are UNAPPROVED placeholders for render verification only.
    {
      id: "demo-bakeri-og-kafe",
      subcategory: "bakeri",
      ownerEmail: "demo-bakeri-og-kafe@example.com",
      name: "Eksempel Bakeri og Kafe AS",
      identitySummaryNo:
        "Lokalt bakeri med kafe. Brød og bakst bakt på stedet, frokost og lunsj.",
      identitySummaryEn:
        "Local bakery with a cafe. Bread and pastries baked on site, breakfast and lunch.",
      description:
        "Eksempel Bakeri og Kafe AS er en fiktiv bedrift laget for å vise hvordan en bedriftsprofil på DinLinks kan brukes.\n\n" +
        "Bedriften illustrerer et lokalt bakeri med kafe, der brød og bakst bakes på stedet og serveres sammen med frokost, lunsj og kaffe. Det meste kan også bestilles med til å ta med.\n\n" +
        "Profilen viser hvordan åpningstider, servering og priser kan presenteres samlet, slik at kunden vet hva stedet er og hva de kan forvente før de går dit.",
      companyStory:
        "Eksempel Bakeri og Kafe AS ble etablert i 1998 og har siden vært drevet som et lokalt bakeri med kafe i samme lokale.\n\n" +
        "Bakeriet baker brød og bakst på stedet hver morgen, og kafeen serverer frokost og lunsj gjennom dagen. Sortimentet endrer seg litt med sesongen.\n\n" +
        "Dette er en fiktiv bedrift. Innholdet er laget for å demonstrere hvordan en virksomhet kan presentere mer enn bare navn og kontaktinformasjon på DinLinks.",
      foundedYear: 1998,
      // One only. The fixed HIGHLIGHT_CODES vocabulary is trade-oriented and
      // has nothing else that honestly fits a bakery, and a single badge keeps
      // this demo distinct from Demo 2 rather than repeating its pair.
      // Supported by the opening hours below, which open Saturday and Sunday.
      highlightCodes: ["WEEKEND_SERVICE"],
      // Eksempeltorget has zero registered addresses in Norway (verified
      // against Kartverket); 2050 is the real Jessheim postal code. The three
      // demos sit in three different Akershus municipalities.
      email: "kontakt@bakeri.eksempel.example",
      website: "https://bakeri.eksempel.example",
      address: "Eksempeltorget 1",
      postalCode: "2050",
      city: "Jessheim",
      // Mixed pricing on purpose: Demo 1 has no prices, Demo 2 prices
      // everything, and this one shows both in a single profile. Take away has
      // no meaningful single price, and NONE blanks the string in
      // normalizeServiceItem — which is the correct outcome, not a loss.
      // Serving windows live in the descriptions; there is no menu field.
      services: [
        { name: "Brød og bakst",        description: "Brød, rundstykker og søt bakst bakt samme dag.",                        price: "fra 45 kr",  priceMode: "FROM" },
        { name: "Frokost",              description: "Frokostservering med kaffe, egg, yoghurt og bakst. Serveres til klokken 11.", price: "fra 145 kr", priceMode: "FROM" },
        { name: "Lunsj",                description: "Dagens suppe, salater og smørbrød. Serveres fra klokken 11.",           price: "fra 165 kr", priceMode: "FROM" },
        { name: "Kaffe og te",          description: "Espresso, filterkaffe, te og andre varme drikker.",                     price: "fra 39 kr",  priceMode: "FROM" },
        { name: "Take away",            description: "Det meste av det vi serverer kan bestilles med til å ta med.",          price: "",           priceMode: "NONE" },
        { name: "Kaker til bestilling", description: "Bursdagskaker og større kaker bestilles noen dager i forveien.",        price: "fra 450 kr", priceMode: "FROM" },
      ],
      // Open seven days from early morning — the only demo that can show
      // "Åpent nå" at a weekend.
      openingHours: {
        monday:    { open: "07:00", close: "17:00" },
        tuesday:   { open: "07:00", close: "17:00" },
        wednesday: { open: "07:00", close: "17:00" },
        thursday:  { open: "07:00", close: "17:00" },
        friday:    { open: "07:00", close: "17:00" },
        saturday:  { open: "08:00", close: "16:00" },
        sunday:    { open: "09:00", close: "15:00" },
      },
      // ── Media: intentionally empty ──────────────────────────────────────
      // The demo ships with no cover and no gallery. Unapproved placeholder
      // imagery is not carried in the repository or the deployed bundle, and an
      // asset URL that no longer resolves would render as a failure rather than
      // as "no media yet".
      //
      // Both states are already handled: an absent cover falls back to the hero
      // gradient, and an empty gallery drops the Photos section and its nav
      // entry rather than showing an empty frame.
      //
      // Final cover, logo and gallery are uploaded through the Business editor
      // once the demos exist in Production. From that point the seed preserves
      // them — media is written only on first create, or on an explicit
      // SEED_OUTREACH_DEMOS_RESET_MEDIA=1, which would blank these again.
      images: [],
    },
  ] as const;

  for (const [index, demo] of demos.entries()) {
    const categoryId = subIdBySlug.get(demo.subcategory);
    if (!categoryId) throw new Error(`Outreach demo: missing subcategory ${demo.subcategory}`);

    const owner = await prisma.user.upsert({
      where:  { email: demo.ownerEmail },
      update: {},
      create: {
        email:    demo.ownerEmail,
        password: ownerPassword,
        name:     `${demo.name} (eksempel)`,
        role:     "BUSINESS",
      },
    });

    // Services carry the shape the public profile reads: every ServiceItem
    // field is written, so a demo never renders a half-populated card.
    const services = demo.services.map((svc, i) => ({
      id:          `${demo.id}-service-${i + 1}`,
      name:        svc.name,
      description: svc.description,
      price:       svc.price,
      priceMode:   svc.priceMode,
      image:       null,
      link:        null,
      linkLabel:   null,
      hidden:      false,
    }));

    const fields = {
      name:              demo.name,
      description:       demo.description,
      categoryId,
      status:            "APPROVED" as const,
      isDemo:            true,
      identitySummaryNo: demo.identitySummaryNo,
      identitySummaryEn: demo.identitySummaryEn,
      companyStory:      demo.companyStory,
      foundedYear:       demo.foundedYear,
      highlightCodes:    [...demo.highlightCodes],
      services,
      address:           demo.address,
      postalCode:        demo.postalCode,
      city:              demo.city,
      // Fictional: 8-digit Norwegian numbers never begin with 0, so these
      // cannot reach a subscriber. `.example` cannot be registered (RFC 2606).
      //
      // Email and website are per-demo rather than one shared literal: three
      // businesses quoting identical contact details read as carelessness to
      // anyone who opens two of these links side by side.
      phone:             `+47 00 00 00 0${index + 1}`,
      email:             demo.email,
      website:           demo.website,
      openingHours:      demo.openingHours,
      // Present on Demo 2 only, so narrowed rather than read directly. Null on
      // the others removes the hero CTA rather than leaving a dead button.
      bookingLink:
        "bookingLink" in demo ? (demo as { bookingLink: string }).bookingLink : null,
      // Deliberately unset: latitude/longitude (no map pin on an invented
      // address), logo (no borrowed brand), organizationNumber and legalName.
      // `logo` in particular is never written by this seed at all, so one
      // uploaded through the editor is safe by construction.
    };

    // Media is deliberately NOT part of `fields`.
    //
    // Once a demo exists, its cover and gallery are managed by hand through the
    // Business editor (sign in as the demo's owner account → Profil → Media),
    // and a later `db:seed` must not quietly undo that work. So media is
    // written when the row is first created and left alone on every run after
    // that, unless the caller explicitly asks for it back:
    //
    //   SEED_OUTREACH_DEMOS=1 SEED_OUTREACH_DEMOS_RESET_MEDIA=1 npm run db:seed
    //
    // Every other field still re-seeds normally, so copy fixes keep flowing.
    // Only Demo 1 carries a cover so far; the other two have none until their
    // content pass, which is why this is narrowed rather than read directly.
    const media = {
      coverImage: "coverImage" in demo ? (demo as { coverImage: string }).coverImage : null,
      images:     [...demo.images],
    };

    await prisma.business.upsert({
      where:  { id: demo.id },
      update: { ...fields, ...(resetMedia ? media : {}) },
      create: { id: demo.id, userId: owner.id, ...fields, ...media },
    });

    console.log(`Outreach demo ready: ${demo.id}`);
  }

  console.log(`Outreach demos created: ${demos.length}`);
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

  await seedOutreachDemos(subIdBySlug);

  // ── LEGACY development demo businesses (SEED_DEMO_BUSINESSES) ─────────────
  //
  // NOT the Outreach Demo system. The two are unrelated and must not be
  // confused:
  //
  //   SEED_DEMO_BUSINESSES  — this block. Real company names (Maaemo, Cutters,
  //                           Elkjøp) DinLinks does not represent. isDemo stays
  //                           false, so these rows are ordinary approved
  //                           businesses: they DO enter the homepage, Search,
  //                           the category pages and every count, they ARE
  //                           indexable, and they DO accept reviews. Local
  //                           development fixtures only. Never seed these to
  //                           production.
  //
  //   SEED_OUTREACH_DEMOS   — seedOutreachDemos() above. Fictional companies,
  //                           isDemo = true, excluded from all discovery,
  //                           noindex, no LocalBusiness JSON-LD, reviews
  //                           refused. Reachable only by direct link, for
  //                           outreach email.
  //
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

  console.log("Legacy development demo businesses created (SEED_DEMO_BUSINESSES). These are NOT outreach demos.");

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
