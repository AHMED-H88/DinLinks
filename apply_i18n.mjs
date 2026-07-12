#!/usr/bin/env node
/**
 * apply_i18n.mjs
 * Run from project root: node apply_i18n.mjs
 *
 * 1. Merges new translation namespaces into messages/no.json
 * 2. Rewrites static-content pages (about, contact, privacy, terms)
 * 3. Rewrites auth pages (login, signup)
 * 4. Patches all other component/page files with targeted replacements
 *
 * Does NOT touch: database, Prisma, Supabase, auth logic, styling, layout.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { join } from "path";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const p    = (...segs) => join(ROOT, ...segs);

// ─── helpers ─────────────────────────────────────────────────────────────────
function read(rel)        { return readFileSync(p(rel), "utf8"); }
function write(rel, src)  { writeFileSync(p(rel), src, "utf8"); console.log(`  ✓ ${rel}`); }
function patch(rel, fn) {
  if (!existsSync(p(rel))) { console.warn(`  ⚠ SKIP (not found): ${rel}`); return; }
  const before = read(rel);
  const after  = fn(before);
  if (after === before) console.warn(`  ⚠ NO CHANGE: ${rel} — check patterns`);
  else write(rel, after);
}

// Ensure a "use client" file imports useTranslations
function ensureUseTranslations(src) {
  if (src.includes("useTranslations")) return src;
  return src.replace(
    /^("use client";\s*\n)/m,
    `$1import { useTranslations } from "next-intl";\n`
  );
}
// Ensure a server component imports getTranslations
function ensureGetTranslations(src) {
  if (src.includes("getTranslations")) return src;
  const lines = src.split("\n");
  let last = -1;
  lines.forEach((l, i) => { if (/^import\s/.test(l)) last = i; });
  if (last === -1) last = 0;
  lines.splice(last + 1, 0, `import { getTranslations } from "next-intl/server";`);
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Update messages/no.json  (merge new namespaces)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n── messages/no.json ─────────────────────────────────────────");
{
  const noJson = JSON.parse(read("messages/no.json"));

  // branches – add missing keys
  Object.assign(noJson.branches, {
    saving:           "Lagrer…",
    noBranchesYet:    "Ingen filialer ennå",
    addFirstBranch:   "Legg til den første filialen for å vise plasseringer på profilen din.",
    branchSingular:   "filial",
    branchPlural:     "filialer",
    editAction:       "Rediger",
    deleteAction:     "Slett",
    namePlaceholder:  "f.eks. Filial Oslo Sentrum",
    addressPlaceholder: "Gateadresse",
    cityPlaceholder:  "Oslo",
    postalPlaceholder:"0150",
    phonePlaceholder: "+47 123 45 678",
    emailPlaceholder: "filial@bedrift.no"
  });

  // home – add missing keys
  Object.assign(noJson.home, {
    statsCount1: "10 000+",
    statsCount2: "8 000+",
    statsCount3: "50 000+",
    heroTitle: "Finn pålitelige lokale bedrifter",
    heroTitleAccent: "på ett sted.",
    exploreBusinesses: "Utforsk bedrifter",
    listYourBusiness: "Registrer bedriften",
    browseAllCategories: "Se alle kategorier",
    whyLabel: "Hvorfor DinLinks",
    whyTitle: "Bygget for tillit og enkelhet",
    feature1Title: "Verifiserte bedrifter",
    feature1Desc: "Hvert oppføring er gjennomgått og godkjent av teamet vårt før publisering.",
    feature2Title: "Alltid oppdatert",
    feature2Desc: "Bedriftseiere holder sine egne åpningstider og kontaktinfo oppdatert.",
    feature3Title: "Lett å finne",
    feature3Desc: "Søk etter navn, kategori eller by. Filtrer for å finne akkurat det du trenger.",
    feature4Title: "Gratis for alle",
    feature4Desc: "Å finne lokale bedrifter på DinLinks er alltid gratis — ingen konto nødvendig.",
    forOwners: "For bedriftseiere",
    ownerBenefit1: "Gratis å opprette profil",
    ownerBenefit2: "Admingodkjenning sikrer kvalitet",
    ownerBenefit3: "Legg til bilder, åpningstider og kontaktinfo",
    ownerBenefit4: "Kunder kan legge igjen verifiserte anmeldelser",
    ownerBenefit5: "Spor profilvisninger i dashboardet ditt",
    viewAllMobile: "Se alle bedrifter"
  });

  // new namespaces
  noJson.auth = {
    login: {
      title: "Velkommen tilbake",
      subtitle: "Logg inn for å fortsette",
      email: "E-postadresse",
      emailPlaceholder: "din@epost.no",
      password: "Passord",
      passwordPlaceholder: "••••••••",
      submit: "Logg inn",
      submitting: "Logger inn...",
      noAccount: "Har du ikke en konto?",
      signUp: "Registrer deg",
      terms: "Ved å logge inn godtar du våre vilkår og personvernregler",
      errorInvalid: "Ugyldig e-post eller passord",
      errorGeneric: "En feil oppstod. Vennligst prøv igjen."
    },
    signup: {
      title: "Opprett konto",
      subtitle: "Registrer din bedrift på DinLinks",
      businessName: "Bedriftsnavn",
      businessNamePlaceholder: "Ditt bedriftsnavn",
      email: "E-postadresse",
      emailPlaceholder: "din@epost.no",
      password: "Passord",
      passwordPlaceholder: "Minst 6 tegn",
      confirmPassword: "Bekreft passord",
      confirmPasswordPlaceholder: "Gjenta passord",
      submit: "Opprett konto",
      submitting: "Oppretter konto...",
      hasAccount: "Har du allerede en konto?",
      signIn: "Logg inn",
      terms: "Ved å registrere deg godtar du våre vilkår og personvernregler",
      errorPasswordMismatch: "Passordene stemmer ikke overens",
      errorPasswordLength: "Passordet må være minst 6 tegn",
      errorGeneric: "En feil oppstod. Vennligst prøv igjen."
    }
  };

  noJson.layout = {
    metaTitle: "DinLinks — Norges bedriftskatalog",
    metaDescription: "Finn verifiserte lokale bedrifter i Norge. Nøyaktige åpningstider, kontaktdetaljer, anmeldelser og mer — alt på ett sted.",
    ogTitle: "DinLinks — Norges bedriftskatalog",
    ogDescription: "Finn verifiserte lokale bedrifter i Norge med nøyaktig kontaktinfo, åpningstider og kundeanmeldelser.",
    twitterDescription: "Finn verifiserte lokale bedrifter i Norge."
  };

  noJson.search = {
    metaTitle: "Søk: {query} · DinLinks",
    metaDefault: "Søk bedrifter | DinLinks",
    heading: "Søkeresultater",
    find: "Finn bedrifter",
    discover: "Oppdag verifiserte bedrifter over hele Norge.",
    placeholder: "Bedriftsnavn, tjeneste eller kategori…"
  };

  noJson.categoriesPage = {
    title: "Bla gjennom",
    allCategories: "Alle kategorier",
    home: "Hjem",
    categoriesLabel: "kategorier",
    verifiedBusinesses: "verifiserte bedrifter"
  };

  noJson.categoryPage = {
    home: "Hjem",
    categories: "Kategorier",
    verified: "verifisert",
    businessSingular: "bedrift",
    businessPlural: "bedrifter",
    andMore: "og mer",
    noBusinesses: "Ingen {category} bedrifter ennå",
    beFirst: "Vær den første til å liste din bedrift i denne kategorien og nå kunder som leter etter {category} tjenester.",
    listYourBusiness: "List din bedrift",
    prevPage: "Forrige side",
    nextPage: "Neste side"
  };

  noJson.dashboard = {
    title: "Dashboard",
    welcomeBack: "Velkommen tilbake,",
    viewPublicProfile: "Se offentlig profil",
    profileViews: "Profilvisninger",
    favorites: "Favoritter",
    reviews: "Anmeldelser",
    branches: "Filialer",
    editProfile: "Rediger bedriftsprofil",
    createProfile: "Opprett din bedriftsprofil",
    editSubtitle: "Endringer lagres umiddelbart. Hvis du ble avvist, vil lagring sende inn på nytt.",
    createSubtitle: "Fyll inn opplysningene dine og send inn for admingodkjenning. Det tar bare noen minutter.",
    gettingStarted: "Komme i gang",
    step1: "Skriv inn bedriftsnavnet og kategorien din",
    step2: "Last opp en logo for et profesjonelt utseende",
    step3: "Legg til kontaktdetaljer og åpningstider",
    step4: "List opp tjenestene og tilbudene dine",
    step5: "Lagre — en admin vil gjennomgå og godkjenne",
    profileInfo: "Profilinfo",
    statusLabel: "Status",
    category: "Kategori",
    city: "By",
    photos: "Bilder",
    approved: "✓ Godkjent",
    pending: "⏳ Venter",
    rejected: "✕ Avvist"
  };

  noJson.admin = {
    title: "Bedriftsadministrasjon",
    subtitle: "Gjennomgå, godkjenn og administrer alle bedriftsoppføringer.",
    total: "Totalt",
    pending: "Venter på gjennomgang",
    approved: "Godkjent",
    rejected: "Avvist",
    categories: {
      title: "Kategorier",
      subtitle: "Opprett og administrer bedriftskategorier."
    }
  };

  noJson.businessCard = {
    verified: "Verifisert",
    noReviews: "Ingen anmeldelser ennå"
  };

  noJson.businessForm = {
    tabs: {
      basicInfo: "Grunnleggende info",
      media: "Media",
      location: "Beliggenhet",
      contact: "Kontakt",
      openingHours: "Åpningstider",
      services: "Tjenester"
    },
    days: {
      monday: "Mandag",
      tuesday: "Tirsdag",
      wednesday: "Onsdag",
      thursday: "Torsdag",
      friday: "Fredag",
      saturday: "Lørdag",
      sunday: "Søndag"
    },
    labels: {
      name: "Bedriftsnavn",
      category: "Kategori",
      description: "Beskrivelse",
      logo: "Logo",
      cover: "Forsidebilde",
      photos: "Bilder",
      address: "Adresse",
      city: "By",
      postalCode: "Postnummer",
      mapsUrl: "Google Maps URL",
      gpsCoordinates: "GPS-koordinater (valgfritt)",
      latitude: "Breddegrad",
      longitude: "Lengdegrad",
      phone: "Telefon",
      email: "E-post",
      website: "Nettsted",
      bookingUrl: "Bestillings-URL",
      openingHours: "Åpningstider",
      services: "Tjenester"
    },
    placeholders: {
      name: "f.eks. Oslo Auto Repair",
      selectCategory: "Velg en kategori",
      description: "Fortell kundene hva bedriften din tilbyr, din historie og hva som gjør deg unik...",
      address: "f.eks. Karl Johans gate 1",
      city: "Oslo",
      postalCode: "0154",
      mapsUrlHint: "Lim inn delingslenken fra Google Maps slik at kunder kan få veibeskrivelse.",
      latitude: "59.9139",
      longitude: "10.7522",
      phone: "+47 123 45 678",
      email: "kontakt@bedrift.no",
      website: "https://www.dinbedrift.no",
      bookingUrl: "https://booking.dinbedrift.no",
      serviceName: "Oljeskift",
      servicePrice: "499 kr",
      serviceDescription: "Kort beskrivelse av denne tjenesten (valgfritt)"
    },
    hints: {
      logo: "Kvadratisk bilde, 400×400 px anbefalt · maks 2 MB · JPG, PNG, WebP",
      cover: "Banner vist øverst på din offentlige profil · 1200×400 px anbefalt · maks 5 MB",
      photos: "Ekstra bilder av lokaler, produkter eller team · maks 5 MB hver",
      bookingUrl: "En direkte lenke for kunder til å bestille avtaler eller reservasjoner.",
      openingHours: "Sett ukeplanen din. Bruk 'Stengt' for dager du ikke er åpen.",
      services: "List opp hva du tilbyr. Kundene vil se disse på profilen din."
    },
    actions: {
      save: "Lagre endringer",
      create: "Opprett profil",
      preview: "Forhåndsvis profil",
      changeLogo: "Endre logo",
      uploadLogo: "Last opp logo",
      removeLogo: "Fjern",
      changeCover: "Endre forsidebilde",
      uploadCover: "Last opp forsidebilde",
      removeCover: "Fjern",
      addPhotos: "Legg til bilder",
      addService: "Legg til tjeneste",
      removeService: "Fjern tjeneste",
      noCoverImage: "Ingen forsidebilde"
    },
    status: {
      approved: "Profil godkjent",
      approvedDesc: "Bedriften din er live og synlig for offentligheten.",
      pending: "Venter på gjennomgang",
      pendingDesc: "En admin vil gjennomgå profilen din snart. Du kan fortsette å redigere mens du venter.",
      rejected: "Profil avvist",
      rejectedDesc: "Vennligst oppdater informasjonen din og lagre igjen for å sende inn på nytt."
    },
    openState: {
      open: "Åpen",
      closed: "Stengt",
      notAvailable: "Ikke tilgjengelig"
    },
    noServices: "Ingen tjenester ennå. Legg til din første nedenfor."
  };

  noJson.businessTable = {
    status: { approved: "Godkjent", pending: "Venter", rejected: "Avvist" },
    deleteConfirm: "Slett bedrift?",
    deleteWarning: "Denne bedriften og alle dens data vil bli slettet permanent. Dette kan ikke angres.",
    cancel: "Avbryt",
    delete: "Slett",
    deleting: "Sletter…",
    columns: {
      owner: "Eier", name: "Navn", email: "E-post", plan: "Plan", free: "Gratis",
      category: "Kategori", city: "By", phone: "Telefon", website: "Nettsted",
      created: "Opprettet", updated: "Oppdatert", categoryCity: "Kategori / By",
      status: "Status", submitted: "Innsendt", actions: "Handlinger", business: "Bedrift"
    },
    sections: {
      businessDetails: "Bedriftsdetaljer", engagement: "Engasjement", views: "Visninger",
      favorites: "Favoritter", reviews: "Anmeldelser", description: "Beskrivelse",
      services: "Tjenester", gallery: "Galleri"
    },
    actions: { approve: "Godkjenn", reject: "Avvis", viewLive: "Se live", details: "Detaljer", delete: "Slett" },
    empty: {
      none: "Ingen bedrifter ennå", noneDesc: "Bedrifter vises her når eiere registrerer seg.",
      noPending: "Ingen ventende gjennomganger", noPendingDesc: "Alle innleveringer er gjennomgått. Godt jobbet!",
      noApproved: "Ingen godkjente bedrifter", noApprovedDesc: "Godkjenn ventende innleveringer for å gjøre dem offentlige.",
      noRejected: "Ingen avviste bedrifter", noRejectedDesc: "Ingen bedrifter har blitt avvist."
    },
    searchPlaceholder: "Søk navn, eier, by…",
    resultSingular: "resultat", resultPlural: "resultater", unnamed: "Uten navn", noCategory: "Ingen kategori"
  };

  noJson.searchFilters = {
    sortBy: "Sorter etter", mostPopular: "Mest populære", mostReviewed: "Mest anmeldt",
    newest: "Nyeste", alphabetical: "A → Å", category: "Kategori", allCategories: "Alle kategorier",
    city: "By", cityPlaceholder: "f.eks. Oslo", go: "Gå", popularCities: "Populære byer",
    clearCity: "Fjern by", resetAll: "Tilbakestill alle filtre"
  };

  noJson.searchResults = {
    noResults: "Ingen bedrifter samsvarer med søket ditt",
    noBusinesses: "Ingen bedrifter ennå",
    adjustFilters: "Prøv å justere filtrene dine eller søk med andre nøkkelord.",
    checkBack: "Kom tilbake snart — bedrifter legges til regelmessig.",
    clearFilters: "Fjern alle filtre →",
    businessSingular: "bedrift", businessPlural: "bedrifter", found: "funnet", for: "for", in: "i"
  };

  noJson.searchBar = {
    placeholder: "Søk etter bedrifter, tjenester eller kategorier...",
    button: "Søk"
  };

  noJson.categoriesClient = {
    searchPlaceholder: "Søk kategorier…",
    noCategories: "Ingen kategorier funnet",
    tryDifferent: "Prøv et annet søkeord.",
    clearSearch: "Fjern søk",
    businessSingular: "bedrift",
    businessPlural: "bedrifter"
  };

  noJson.categoryList = { businessPlural: "bedrifter" };

  noJson.categoryManager = {
    addNew: "Legg til ny kategori",
    namePlaceholder: "Kategorinavn",
    addButton: "Legg til kategori",
    allCategories: "Alle kategorier",
    businessSingular: "bedrift",
    businessPlural: "bedrifter",
    delete: "Slett",
    deleteConfirm: "Er du sikker på at du vil slette denne kategorien?"
  };

  noJson.categorySortBar = {
    sortBy: "Sorter etter", mostPopular: "Mest populære", mostReviewed: "Mest anmeldt",
    newest: "Nyeste", alphabetical: "A → Å"
  };

  noJson.favoriteButton = { saved: "Lagret", save: "Lagre" };

  noJson.subscriptionCard = {
    createFirst: "Vennligst opprett bedriftsprofilen din først",
    title: "Abonnement", active: "Aktiv", plan: "Plan:", renews: "Fornyes:",
    monthly: {
      title: "Månedlig plan", price: "$29/måned",
      feature1: "Profiloppføring", feature2: "Bildegalleri",
      feature3: "Kontaktinformasjon", feature4: "Kundeanmeldelser",
      subscribe: "Abonner månedlig"
    },
    yearly: {
      badge: "Spar 20%", title: "Årlig plan", price: "$279/år",
      subscribe: "Abonner årlig", prioritySupport: "Prioritert støtte"
    }
  };

  noJson.adminNav = {
    admin: "ADMIN", businesses: "Bedrifter", categories: "Kategorier", signOut: "Logg ut"
  };

  noJson.about = {
    title: "Om DinLinks",
    subtitle: "Vi kobler lokale bedrifter med kunder på en enkel, moderne og effektiv måte.",
    vision: {
      heading: "Vår visjon",
      p1: "DinLinks ble grunnlagt med en enkel visjon: å gjøre det lettere for folk å finne og kontakte lokale bedrifter i sitt område.",
      p2: "Vi tror på å støtte lokale bedrifter og hjelpe dem med å vokse ved å gi dem en moderne, profesjonell plattform for å nå sine kunder."
    },
    tagline: "Koble bedrifter med kunder",
    why: {
      heading: "Hvorfor velge DinLinks?",
      search: { title: "Enkel søk", desc: "Finn lokale bedrifter raskt og enkelt med vårt intuitive søkesystem." },
      platform: { title: "Moderne plattform", desc: "En profesjonell og brukervennlig plattform bygget med de nyeste teknologiene." },
      support: { title: "Støtte lokale bedrifter", desc: "Hjelp lokale bedrifter å vokse ved å gjøre dem mer synlige i ditt område." }
    },
    cta: {
      heading: "Klar til å komme i gang?",
      subtitle: "Enten du er en kunde som leter etter lokale tjenester, eller en bedrift som ønsker å nå flere kunder.",
      search: "Søk bedrifter",
      register: "Registrer bedrift"
    }
  };

  noJson.contact = {
    title: "Kontakt oss",
    subtitle: "Har du spørsmål eller tilbakemeldinger? Vi hører gjerne fra deg!",
    info: {
      heading: "Kontaktinformasjon", email: "E-post", address: "Adresse",
      company: "DinLinks AS", location: "Oslo, Norge", hours: "Åpningstider",
      weekdays: "Mandag – fredag: 09:00 – 17:00", weekend: "Lørdag – søndag: Stengt"
    },
    form: {
      heading: "Send oss en melding", name: "Navn", namePlaceholder: "Ditt navn",
      email: "E-post", emailPlaceholder: "din@epost.no", subject: "Emne",
      subjectPlaceholder: "Hva gjelder henvendelsen?", message: "Melding",
      messagePlaceholder: "Skriv din melding her...", submit: "Send melding"
    },
    faq: {
      heading: "Ofte stilte spørsmål",
      q1: "Hvordan registrerer jeg min bedrift?",
      a1: "Klikk på \"Registrer deg\" øverst på siden, fyll ut skjemaet med bedriftsinformasjon, og vent på godkjenning fra vårt team.",
      q2: "Er det gratis å registrere bedriften min?",
      a2: "Ja, grunnleggende registrering er gratis. Vi tilbyr også premium-pakker med ekstra funksjoner og synlighet.",
      q3: "Hvor lang tid tar det før bedriften min blir godkjent?",
      a3: "Vi behandler alle søknader innen 1–2 virkedager. Du vil motta en e-post når bedriften din er godkjent.",
      q4: "Kan jeg redigere bedriftsprofilen min etter publisering?",
      a4: "Ja, du kan når som helst logge inn på dashboardet ditt og oppdatere bedriftsinformasjonen din."
    }
  };

  noJson.privacy = {
    title: "Personvernerklæring",
    intro: {
      heading: "1. Innledning",
      p1: "Denne personvernerklæringen beskriver hvordan DinLinks (\"vi\", \"oss\" eller \"vår\") samler inn, bruker og beskytter dine personopplysninger når du bruker vår plattform.",
      p2: "Vi er forpliktet til å beskytte personvernet ditt og behandler alle personopplysninger i samsvar med gjeldende personvernlovgivning, inkludert GDPR."
    },
    dataCollection: {
      heading: "2. Informasjon vi samler inn",
      intro: "Vi samler inn følgende typer informasjon:",
      item1: "Kontaktinformasjon (navn, e-post, telefonnummer)",
      item2: "Bedriftsinformasjon (for bedriftskontoer)",
      item3: "Bruksdata og preferanser",
      item4: "Teknisk informasjon (IP-adresse, nettlesertype)"
    },
    dataUse: {
      heading: "3. Hvordan vi bruker informasjonen",
      intro: "Vi bruker dine personopplysninger til:",
      item1: "Å tilby og forbedre våre tjenester",
      item2: "Å kommunisere med deg om din konto og tjenester",
      item3: "Å personalisere din opplevelse",
      item4: "Å sikre plattformens sikkerhet og forebygge svindel"
    },
    dataSharing: {
      heading: "4. Deling av informasjon",
      text: "Vi selger ikke dine personopplysninger. Vi kan dele informasjon med tjenesteleverandører som hjelper oss med å drive plattformen, men kun i den grad det er nødvendig for å levere våre tjenester."
    },
    rights: {
      heading: "5. Dine rettigheter",
      intro: "Du har rett til å:",
      item1: "Få tilgang til dine personopplysninger",
      item2: "Rette unøyaktige opplysninger",
      item3: "Slette dine personopplysninger",
      item4: "Trekke tilbake samtykke"
    },
    contact: {
      heading: "6. Kontakt oss",
      text: "Hvis du har spørsmål om denne personvernerklæringen, vennligst kontakt oss på"
    }
  };

  noJson.terms = {
    title: "Vilkår og betingelser",
    acceptance: {
      heading: "1. Aksept av vilkår",
      text: "Ved å bruke DinLinks (\"tjenesten\") godtar du å være bundet av disse vilkårene og betingelsene. Hvis du ikke godtar disse vilkårene, vennligst ikke bruk tjenesten."
    },
    usage: {
      heading: "2. Bruk av tjenesten",
      p1: "Du godtar å bruke tjenesten kun til lovlige formål og på en måte som ikke krenker rettighetene til, eller begrenser eller hemmer bruken av tjenesten av andre.",
      p2: "Du må ikke bruke tjenesten på en måte som kan skade, deaktivere, overbelaste eller forringe tjenesten, eller forstyrre andre parters bruk av tjenesten."
    },
    accounts: {
      heading: "3. Brukerkontoer",
      intro: "For å få tilgang til visse funksjoner i tjenesten, kan du bli pålagt å opprette en konto. Du godtar å:",
      item1: "Oppgi nøyaktig, fullstendig og oppdatert informasjon",
      item2: "Opprettholde sikkerheten til passordet ditt",
      item3: "Umiddelbart varsle oss om uautorisert bruk av din konto"
    },
    profiles: {
      heading: "4. Bedriftsprofiler",
      intro: "Hvis du registrerer en bedriftsprofil, godtar du:",
      item1: "At all informasjon du oppgir er sann og nøyaktig",
      item2: "At du har rett til å representere bedriften",
      item3: "At du vil holde informasjonen oppdatert",
      item4: "At profilen kan bli verifisert før godkjenning"
    },
    ip: {
      heading: "5. Immaterielle rettigheter",
      text: "Tjenesten og dens originale innhold, funksjoner og funksjonalitet eies av DinLinks og er beskyttet av norske og internasjonale lover om opphavsrett, varemerke, patent, forretningshemmeligheter og andre immaterielle rettigheter."
    },
    disclaimer: {
      heading: "6. Ansvarsfraskrivelse",
      text: "Tjenesten leveres \"som den er\" og \"som tilgjengelig\" uten noen form for garanti. Vi garanterer ikke at tjenesten vil være uavbrutt, sikker eller feilfri."
    },
    liability: {
      heading: "7. Ansvarsbegrensning",
      text: "DinLinks skal ikke holdes ansvarlig for indirekte, tilfeldige, spesielle, følgeskader eller straffeskader, inkludert tap av fortjeneste, data, bruk eller andre immaterielle tap."
    },
    changes: {
      heading: "8. Endringer i vilkår",
      text: "Vi forbeholder oss retten til å endre disse vilkårene når som helst. Vi vil varsle deg om endringer ved å publisere de nye vilkårene på denne siden."
    },
    contact: {
      heading: "9. Kontakt oss",
      text: "Hvis du har spørsmål om disse vilkårene, vennligst kontakt oss på"
    }
  };

  write("messages/no.json", JSON.stringify(noJson, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Static-content pages — full rewrites
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n── Static pages ─────────────────────────────────────────────");

write("app/[locale]/about/page.tsx", `import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("title")}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>

        {/* Vision */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("vision.heading")}</h2>
          <p className="text-gray-600 mb-4">{t("vision.p1")}</p>
          <p className="text-gray-600">{t("vision.p2")}</p>
        </div>

        {/* Tagline */}
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8 mb-8 text-center">
          <p className="text-2xl font-semibold text-primary-700">{t("tagline")}</p>
        </div>

        {/* Why */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("why.heading")}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(["search", "platform", "support"] as const).map((key) => (
              <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{t(\`why.\${key}.title\`)}</h3>
                <p className="text-gray-600 text-sm">{t(\`why.\${key}.desc\`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">{t("cta.heading")}</h2>
          <p className="text-gray-300 mb-6">{t("cta.subtitle")}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={\`/\${locale}/search\`} className="btn btn-primary">{t("cta.search")}</Link>
            <Link href={\`/\${locale}/dashboard\`} className="btn bg-white text-gray-900 hover:bg-gray-100">{t("cta.register")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

write("app/[locale]/contact/page.tsx", `import { getTranslations } from "next-intl/server";

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("title")}</h1>
          <p className="text-xl text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t("info.heading")}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">{t("info.email")}</p>
                <a href="mailto:support@dinlinks.no" className="text-primary-600 hover:underline">support@dinlinks.no</a>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">{t("info.address")}</p>
                <p className="text-gray-700">{t("info.company")}</p>
                <p className="text-gray-700">{t("info.location")}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">{t("info.hours")}</p>
                <p className="text-gray-700">{t("info.weekdays")}</p>
                <p className="text-gray-700">{t("info.weekend")}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t("form.heading")}</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("form.name")}</label>
                <input type="text" placeholder={t("form.namePlaceholder")} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("form.email")}</label>
                <input type="email" placeholder={t("form.emailPlaceholder")} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("form.subject")}</label>
                <input type="text" placeholder={t("form.subjectPlaceholder")} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("form.message")}</label>
                <textarea rows={4} placeholder={t("form.messagePlaceholder")} className="input resize-none" />
              </div>
              <button type="submit" className="btn btn-primary w-full">{t("form.submit")}</button>
            </form>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("faq.heading")}</h2>
          <div className="space-y-4">
            {(["1","2","3","4"] as const).map((n) => (
              <div key={n} className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{t(\`faq.q\${n}\`)}</h3>
                <p className="text-gray-600 text-sm">{t(\`faq.a\${n}\`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`);

write("app/[locale]/privacy/page.tsx", `import { getTranslations } from "next-intl/server";

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">{t("title")}</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("intro.heading")}</h2>
            <p className="text-gray-600 mb-3">{t("intro.p1")}</p>
            <p className="text-gray-600">{t("intro.p2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("dataCollection.heading")}</h2>
            <p className="text-gray-600 mb-3">{t("dataCollection.intro")}</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              {(["1","2","3","4"] as const).map((n) => (
                <li key={n}>{t(\`dataCollection.item\${n}\`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("dataUse.heading")}</h2>
            <p className="text-gray-600 mb-3">{t("dataUse.intro")}</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              {(["1","2","3","4"] as const).map((n) => (
                <li key={n}>{t(\`dataUse.item\${n}\`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("dataSharing.heading")}</h2>
            <p className="text-gray-600">{t("dataSharing.text")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("rights.heading")}</h2>
            <p className="text-gray-600 mb-3">{t("rights.intro")}</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              {(["1","2","3","4"] as const).map((n) => (
                <li key={n}>{t(\`rights.item\${n}\`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("contact.heading")}</h2>
            <p className="text-gray-600">
              {t("contact.text")}{" "}
              <a href="mailto:privacy@dinlinks.no" className="text-primary-600 hover:underline">
                privacy@dinlinks.no
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
`);

write("app/[locale]/terms/page.tsx", `import { getTranslations } from "next-intl/server";

export default async function TermsPage({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  const listSections = [
    { key: "accounts", items: ["1","2","3"] },
    { key: "profiles", items: ["1","2","3","4"] },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">{t("title")}</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("acceptance.heading")}</h2>
            <p className="text-gray-600">{t("acceptance.text")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("usage.heading")}</h2>
            <p className="text-gray-600 mb-3">{t("usage.p1")}</p>
            <p className="text-gray-600">{t("usage.p2")}</p>
          </section>

          {listSections.map(({ key, items }) => (
            <section key={key}>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{t(\`\${key}.heading\`)}</h2>
              <p className="text-gray-600 mb-3">{t(\`\${key}.intro\`)}</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                {items.map((n) => <li key={n}>{t(\`\${key}.item\${n}\`)}</li>)}
              </ul>
            </section>
          ))}

          {(["ip","disclaimer","liability","changes"] as const).map((key) => (
            <section key={key}>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{t(\`\${key}.heading\`)}</h2>
              <p className="text-gray-600">{t(\`\${key}.text\`)}</p>
            </section>
          ))}

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("contact.heading")}</h2>
            <p className="text-gray-600">
              {t("contact.text")}{" "}
              <a href="mailto:support@dinlinks.no" className="text-primary-600 hover:underline">
                support@dinlinks.no
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Auth pages — targeted patches
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n── Auth pages ───────────────────────────────────────────────");

patch("app/[locale]/(auth)/login/page.tsx", (src) => {
  src = ensureUseTranslations(src);
  // Add t inside the component (after the first useState or before return)
  if (!src.includes('useTranslations("auth"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("auth");`
    );
  }
  // String replacements
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"Invalid email or password"`,           `t("login.errorInvalid")`);
  r(`"An error occurred\\. Please try again\\."`, `t("login.errorGeneric")`);
  r(`"Velkommen tilbake"`,                   `t("login.title")`);
  r(`"Logg inn for å fortsette"`,            `t("login.subtitle")`);
  r(`"E-postadresse"`,                       `t("login.email")`);
  r(`placeholder="din@epost\\.no"`,          `placeholder={t("login.emailPlaceholder")}`);
  r(`"Passord"`,                             `t("login.password")`);
  r(`placeholder="••••••••"`,               `placeholder={t("login.passwordPlaceholder")}`);
  r(`"Logger inn\\.\\.\\."`,                `t("login.submitting")`);
  r(`"Logg inn"`,                            `t("login.submit")`);
  r(`"Har du ikke en konto\\?"`,            `t("login.noAccount")`);
  r(`"Registrer deg"`,                       `t("login.signUp")`);
  r(`"Ved å logge inn godtar du våre vilkår og personvernregler"`, `t("login.terms")`);
  return src;
});

patch("app/[locale]/(auth)/signup/page.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("auth"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("auth");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"Passordene stemmer ikke overens"`,     `t("signup.errorPasswordMismatch")`);
  r(`"Passordet må være minst 6 tegn"`,     `t("signup.errorPasswordLength")`);
  r(`"En feil oppstod\\. Vennligst prøv igjen\\."`, `t("signup.errorGeneric")`);
  r(`"En feil oppstod"`,                    `t("signup.errorGeneric")`);
  r(`"Opprett konto"`,                      `t("signup.title")`);
  r(`"Registrer din bedrift på DinLinks"`,  `t("signup.subtitle")`);
  r(`"Bedriftsnavn"`,                       `t("signup.businessName")`);
  r(`placeholder="Ditt bedriftsnavn"`,      `placeholder={t("signup.businessNamePlaceholder")}`);
  r(`"E-postadresse"`,                      `t("signup.email")`);
  r(`placeholder="din@epost\\.no"`,         `placeholder={t("signup.emailPlaceholder")}`);
  r(`"Passord"`,                            `t("signup.password")`);
  r(`placeholder="Minst 6 tegn"`,           `placeholder={t("signup.passwordPlaceholder")}`);
  r(`"Bekreft passord"`,                    `t("signup.confirmPassword")`);
  r(`placeholder="Gjenta passord"`,         `placeholder={t("signup.confirmPasswordPlaceholder")}`);
  r(`"Oppretter konto\\.\\.\\."`,           `t("signup.submitting")`);
  r(`"Har du allerede en konto\\?"`,        `t("signup.hasAccount")`);
  r(`"Logg inn"`,                           `t("signup.signIn")`);
  r(`"Ved å registrere deg godtar du våre vilkår og personvernregler"`, `t("signup.terms")`);
  return src;
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. layout.tsx — meta tags
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n── Layout & pages ───────────────────────────────────────────");

patch("app/[locale]/layout.tsx", (src) => {
  src = ensureGetTranslations(src);
  // Replace hardcoded meta strings
  src = src.replace(`"DinLinks — Norway's Business Directory"`, `t("metaTitle")`);
  src = src.replace(`"Find verified local businesses in Norway. Accurate opening hours, contact details, reviews, and more — all in one place."`, `t("metaDescription")`);
  src = src.replace(`"Find verified local businesses in Norway with accurate contact info, opening hours, and customer reviews."`, `t("ogDescription")`);
  src = src.replace(`"Find verified local businesses in Norway."`, `t("twitterDescription")`);
  // Add t declaration in generateMetadata if not already there
  if (!src.includes('getTranslations({ locale, namespace: "layout"')) {
    src = src.replace(
      /(export async function generateMetadata[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "layout" });`
    );
  }
  return src;
});

patch("app/[locale]/search/page.tsx", (src) => {
  src = ensureGetTranslations(src);
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  // Add t in generateMetadata
  if (!src.includes('namespace: "search"')) {
    src = src.replace(
      /(export async function generateMetadata[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "search" });`
    );
    src = src.replace(
      /(export default async function\s+\w+[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "search" });`
    );
  }
  r(`"Search: "`,                            `t("metaTitle", { query: `);
  r(`"Search businesses \\| DinLinks"`,     `t("metaDefault")`);
  r(`"Search results"`,                      `t("heading")`);
  r(`"Find businesses"`,                     `t("find")`);
  r(`"Discover verified businesses across Norway\\."`, `t("discover")`);
  r(`"Business name, service, or category…"`, `t("placeholder")`);
  return src;
});

patch("app/[locale]/categories/page.tsx", (src) => {
  src = ensureGetTranslations(src);
  if (!src.includes('namespace: "categoriesPage"')) {
    src = src.replace(
      /(export default async function\s+\w+[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "categoriesPage" });`
    );
  }
  src = src.replace(/"Browse"/g,            `t("title")`);
  src = src.replace(/"All categories"/g,    `t("allCategories")`);
  src = src.replace(/"categories ·"/g,      `\`\${t("categoriesLabel")} ·\``);
  src = src.replace(/"verified businesses"/g, `t("verifiedBusinesses")`);
  return src;
});

patch("app/[locale]/categories/[slug]/page.tsx", (src) => {
  src = ensureGetTranslations(src);
  if (!src.includes('namespace: "categoryPage"')) {
    src = src.replace(
      /(export default async function\s+\w+[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "categoryPage" });`
    );
    src = src.replace(
      /(export async function generateMetadata[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "categoryPage" });`
    );
  }
  src = src.replace(/"Home"/g,             `t("home")`);
  src = src.replace(/"Categories"/g,       `t("categories")`);
  src = src.replace(/"verified"/g,         `t("verified")`);
  src = src.replace(/"business"/g,         `t("businessSingular")`);
  src = src.replace(/"businesses"/g,       `t("businessPlural")`);
  src = src.replace(/"and more"/g,         `t("andMore")`);
  src = src.replace(/"List your business"/g, `t("listYourBusiness")`);
  return src;
});

patch("app/[locale]/dashboard/page.tsx", (src) => {
  src = ensureGetTranslations(src);
  if (!src.includes('namespace: "dashboard"')) {
    src = src.replace(
      /(export default async function\s+\w+[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "dashboard" });`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"Dashboard"`,                          `t("title")`);
  r(`"Welcome back,"`,                      `t("welcomeBack")`);
  r(`"View public profile"`,               `t("viewPublicProfile")`);
  r(`"Profile views"`,                     `t("profileViews")`);
  r(`"Profilvisninger"`,                   `t("profileViews")`);
  r(`"Favourites"`,                        `t("favorites")`);
  r(`"Favoritter"`,                        `t("favorites")`);
  r(`"Reviews"`,                           `t("reviews")`);
  r(`"Anmeldelser"`,                       `t("reviews")`);
  r(`"Branches"`,                          `t("branches")`);
  r(`"Filialer"`,                          `t("branches")`);
  r(`"Edit business profile"`,             `t("editProfile")`);
  r(`"Create your business profile"`,      `t("createProfile")`);
  r(`"Changes are saved immediately\\. If you were rejected, saving will re-submit for review\\."`, `t("editSubtitle")`);
  r(`"Fill in your details and submit for admin approval\\. It only takes a few minutes\\."`, `t("createSubtitle")`);
  r(`"Getting started"`,                   `t("gettingStarted")`);
  r(`"Enter your business name and category"`, `t("step1")`);
  r(`"Upload a logo for a professional look"`, `t("step2")`);
  r(`"Add contact details and opening hours"`, `t("step3")`);
  r(`"List your services and offers"`,     `t("step4")`);
  r(`"Save — an admin will review and approve"`, `t("step5")`);
  r(`"Profile info"`,                      `t("profileInfo")`);
  r(`"Status"`,                            `t("statusLabel")`);
  r(`"Category"`,                          `t("category")`);
  r(`"City"`,                              `t("city")`);
  r(`"Photos"`,                            `t("photos")`);
  r(`"✓ Approved"`,                        `t("approved")`);
  r(`"⏳ Pending"`,                         `t("pending")`);
  r(`"✕ Rejected"`,                        `t("rejected")`);
  return src;
});

patch("app/[locale]/admin/page.tsx", (src) => {
  src = ensureGetTranslations(src);
  if (!src.includes('namespace: "admin"')) {
    src = src.replace(
      /(export default async function\s+\w+[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "admin" });`
    );
  }
  src = src.replace(/"Business management"/g, `t("title")`);
  src = src.replace(/"Review, approve, and manage all business listings\."/g, `t("subtitle")`);
  src = src.replace(/"Total"/g,              `t("total")`);
  src = src.replace(/"Pending review"/g,     `t("pending")`);
  src = src.replace(/"Approved"/g,           `t("approved")`);
  src = src.replace(/"Rejected"/g,           `t("rejected")`);
  return src;
});

patch("app/[locale]/admin/categories/page.tsx", (src) => {
  src = ensureGetTranslations(src);
  if (!src.includes('namespace: "admin"')) {
    src = src.replace(
      /(export default async function\s+\w+[^{]*\{)/,
      `$1\n  const t = await getTranslations({ locale, namespace: "admin" });`
    );
  }
  src = src.replace(/"Categories"/g,        `t("categories.title")`);
  src = src.replace(/"Create and manage business categories\."/g, `t("categories.subtitle")`);
  return src;
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Components
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n── Components ───────────────────────────────────────────────");

patch("components/SearchBar.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("searchBar"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("searchBar");`
    );
  }
  src = src.replace(/"Search businesses, services or categories\.\.\."/g, `t("placeholder")`);
  src = src.replace(/"Search"/g, `t("button")`);
  return src;
});

patch("components/SearchFilters.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("searchFilters"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("searchFilters");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"Most popular"`,   `t("mostPopular")`);
  r(`"Most reviewed"`,  `t("mostReviewed")`);
  r(`"Newest"`,         `t("newest")`);
  r(`"A → Z"`,          `t("alphabetical")`);
  r(`"Sort by"`,        `t("sortBy")`);
  r(`"Category"`,       `t("category")`);
  r(`"All categories"`, `t("allCategories")`);
  r(`"City"`,           `t("city")`);
  r(`placeholder="e\\.g\\. Oslo"`, `placeholder={t("cityPlaceholder")}`);
  r(`"Go"`,             `t("go")`);
  r(`"Popular cities"`, `t("popularCities")`);
  r(`"Clear city"`,     `t("clearCity")`);
  r(`"Reset all filters"`, `t("resetAll")`);
  return src;
});

patch("components/SearchResults.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("searchResults"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("searchResults");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"No businesses match your search"`,   `t("noResults")`);
  r(`"No businesses yet"`,                 `t("noBusinesses")`);
  r(`"Try adjusting your filters or search with different keywords\\."`, `t("adjustFilters")`);
  r(`"Check back soon — businesses are being added regularly\\."`, `t("checkBack")`);
  r(`"Clear all filters →"`,               `t("clearFilters")`);
  r(`"businesses"`,                        `t("businessPlural")`);
  r(`"business"`,                          `t("businessSingular")`);
  r(`"found"`,                             `t("found")`);
  r(`" for "`,                             ` t("for") + " "`);
  r(`" in "`,                              ` t("in") + " "`);
  return src;
});

patch("components/BusinessCard.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("businessCard"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("businessCard");`
    );
  }
  src = src.replace(/"Verified"/g,      `t("verified")`);
  src = src.replace(/"No reviews yet"/g, `t("noReviews")`);
  return src;
});

patch("components/FavoriteButton.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("favoriteButton"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("favoriteButton");`
    );
  }
  src = src.replace(/"❤️ Lagret"/g, `"❤️ " + t("saved")`);
  src = src.replace(/"🤍 Lagre"/g,  `"🤍 " + t("save")`);
  return src;
});

patch("components/DashboardNav.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("nav"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("nav");`
    );
  }
  src = src.replace(/"Sign Out"/g, `t("signOut")`);
  return src;
});

patch("components/AdminNav.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("adminNav"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("adminNav");`
    );
  }
  src = src.replace(/"ADMIN"/g,       `t("admin")`);
  src = src.replace(/"Businesses"/g,  `t("businesses")`);
  src = src.replace(/"Categories"/g,  `t("categories")`);
  src = src.replace(/"Sign out"/g,    `t("signOut")`);
  return src;
});

patch("components/CategoryList.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("categoryList"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("categoryList");`
    );
  }
  src = src.replace(/"businesses"/g, `t("businessPlural")`);
  return src;
});

patch("components/CategoriesClient.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("categoriesClient"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("categoriesClient");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"Search categories…"`,       `t("searchPlaceholder")`);
  r(`placeholder="Search categories…"`, `placeholder={t("searchPlaceholder")}`);
  r(`"No categories found"`,       `t("noCategories")`);
  r(`"Try a different search term\\."`, `t("tryDifferent")`);
  r(`"Clear search"`,              `t("clearSearch")`);
  r(`"businesses"`,                `t("businessPlural")`);
  r(`"business"`,                  `t("businessSingular")`);
  return src;
});

patch("components/CategoryManager.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("categoryManager"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("categoryManager");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"Are you sure you want to delete this category\\?"`, `t("deleteConfirm")`);
  r(`"Add New Category"`,     `t("addNew")`);
  r(`placeholder="Category name"`, `placeholder={t("namePlaceholder")}`);
  r(`"Add Category"`,         `t("addButton")`);
  r(`"All Categories"`,       `t("allCategories")`);
  r(`"businesses"`,           `t("businessPlural")`);
  r(`"business"`,             `t("businessSingular")`);
  r(`"Delete"`,               `t("delete")`);
  return src;
});

patch("components/CategorySortBar.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("categorySortBar"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("categorySortBar");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"Most popular"`,  `t("mostPopular")`);
  r(`"Most reviewed"`, `t("mostReviewed")`);
  r(`"Newest"`,        `t("newest")`);
  r(`"A → Z"`,         `t("alphabetical")`);
  r(`"Sort by"`,       `t("sortBy")`);
  return src;
});

patch("components/SubscriptionCard.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("subscriptionCard"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("subscriptionCard");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  r(`"Please create your business profile first"`, `t("createFirst")`);
  r(`"Subscription"`,    `t("title")`);
  r(`"Active"`,          `t("active")`);
  r(`"Plan:"`,           `t("plan")`);
  r(`"Renews:"`,         `t("renews")`);
  r(`"Monthly Plan"`,    `t("monthly.title")`);
  r(`"\\$29/month"`,     `t("monthly.price")`);
  r(`"✓ Profile listing"`, `"✓ " + t("monthly.feature1")`);
  r(`"✓ Image gallery"`, `"✓ " + t("monthly.feature2")`);
  r(`"✓ Contact information"`, `"✓ " + t("monthly.feature3")`);
  r(`"✓ Customer reviews"`, `"✓ " + t("monthly.feature4")`);
  r(`"Subscribe Monthly"`, `t("monthly.subscribe")`);
  r(`"Save 20%"`,        `t("yearly.badge")`);
  r(`"Yearly Plan"`,     `t("yearly.title")`);
  r(`"\\$279/year"`,     `t("yearly.price")`);
  r(`"Subscribe Yearly"`, `t("yearly.subscribe")`);
  r(`"✓ Priority support"`, `"✓ " + t("yearly.prioritySupport")`);
  return src;
});

patch("components/BranchManager.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("branches"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("branches");\n  const tProfile = useTranslations("profile");`
    );
    // Ensure useTranslations import covers both
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  // Day labels - replace isNo ternaries
  r(`isNo\\s*\\?\\s*"Mandag"\\s*:\\s*"Monday"`,    `tProfile("days.monday")`);
  r(`isNo\\s*\\?\\s*"Tirsdag"\\s*:\\s*"Tuesday"`,  `tProfile("days.tuesday")`);
  r(`isNo\\s*\\?\\s*"Onsdag"\\s*:\\s*"Wednesday"`, `tProfile("days.wednesday")`);
  r(`isNo\\s*\\?\\s*"Torsdag"\\s*:\\s*"Thursday"`, `tProfile("days.thursday")`);
  r(`isNo\\s*\\?\\s*"Fredag"\\s*:\\s*"Friday"`,    `tProfile("days.friday")`);
  r(`isNo\\s*\\?\\s*"Lørdag"\\s*:\\s*"Saturday"`,  `tProfile("days.saturday")`);
  r(`isNo\\s*\\?\\s*"Søndag"\\s*:\\s*"Sunday"`,    `tProfile("days.sunday")`);
  // Other isNo ternaries
  r(`isNo\\s*\\?\\s*"Stengt"\\s*:\\s*"Closed"`,    `t("closed")`);
  r(`isNo\\s*\\?\\s*"Rediger filial"\\s*:\\s*"Edit branch"`, `t("edit")`);
  r(`isNo\\s*\\?\\s*"Legg til filial"\\s*:\\s*"Add branch"`, `t("add")`);
  r(`isNo\\s*\\?\\s*"Navn på filial \\*"\\s*:\\s*"Branch name \\*"`, `t("name") + " *"`);
  r(`isNo\\s*\\?\\s*"f\\.eks\\. Filial Oslo Sentrum"\\s*:\\s*"e\\.g\\. Oslo City Centre"`, `t("namePlaceholder")`);
  r(`isNo\\s*\\?\\s*"Adresse"\\s*:\\s*"Address"`,  `t("address")`);
  r(`isNo\\s*\\?\\s*"Gateadresse"\\s*:\\s*"Street address"`, `t("addressPlaceholder")`);
  r(`isNo\\s*\\?\\s*"By"\\s*:\\s*"City"`,          `t("city")`);
  r(`isNo\\s*\\?\\s*"Oslo"\\s*:\\s*"Oslo"`,         `t("cityPlaceholder")`);
  r(`isNo\\s*\\?\\s*"Postnummer"\\s*:\\s*"Postal code"`, `t("postalCode")`);
  r(`isNo\\s*\\?\\s*"0150"\\s*:\\s*"0150"`,         `t("postalPlaceholder")`);
  r(`isNo\\s*\\?\\s*"Telefon"\\s*:\\s*"Phone"`,     `t("phone")`);
  r(`isNo\\s*\\?\\s*"E-post"\\s*:\\s*"Email"`,      `t("email")`);
  r(`isNo\\s*\\?\\s*"filial@bedrift\\.no"\\s*:\\s*"branch@business\\.no"`, `t("emailPlaceholder")`);
  r(`isNo\\s*\\?\\s*"Sett som hovedfilial"\\s*:\\s*"Set as main branch"`, `t("setMain")`);
  r(`isNo\\s*\\?\\s*"Kun én filial kan være hovedfilialen\\."\\s*:\\s*"Only one branch can be the main branch\\."`, `t("setMainDesc")`);
  r(`isNo\\s*\\?\\s*"Åpningstider"\\s*:\\s*"Opening hours"`, `t("openingHours")`);
  r(`isNo\\s*\\?\\s*"Avbryt"\\s*:\\s*"Cancel"`,    `t("cancel")`);
  r(`isNo\\s*\\?\\s*"Lagrer…"\\s*:\\s*"Saving…"`,  `t("saving")`);
  r(`isNo\\s*\\?\\s*"Lagre endringer"\\s*:\\s*"Save changes"`, `t("save")`);
  r(`isNo\\s*\\?\\s*"Slett filial\\?"\\s*:\\s*"Delete branch\\?"`, `t("confirmDelete")`);
  r(`isNo\\s*\\?\\s*"vil bli slettet permanent\\."\\s*:\\s*"will be permanently deleted\\."`, `t("deleteWarning")`);
  r(`isNo\\s*\\?\\s*"Filialer"\\s*:\\s*"Branches"`, `t("title")`);
  r(`isNo\\s*\\?\\s*"Ingen filialer lagt til ennå\\."\\s*:\\s*"No branches added yet\\."`, `t("noBranches")`);
  r(`isNo\\s*\\?\\s*"1 filial"\\s*:\\s*"1 branch"`, `"1 " + t("branchSingular")`);
  r(`isNo\\s*\\?\\s*"filialer"\\s*:\\s*"branches"`, `t("branchPlural")`);
  r(`isNo\\s*\\?\\s*"Ingen filialer ennå"\\s*:\\s*"No branches yet"`, `t("noBranchesYet")`);
  r(`isNo\\s*\\?\\s*"Legg til den første filialen[^"]*"\\s*:\\s*"Add your first branch[^"]*"`, `t("addFirstBranch")`);
  r(`isNo\\s*\\?\\s*"Hovedfilial"\\s*:\\s*"Main branch"`, `t("main")`);
  r(`isNo\\s*\\?\\s*"Rediger"\\s*:\\s*"Edit"`,      `t("editAction")`);
  r(`isNo\\s*\\?\\s*"Slett"\\s*:\\s*"Delete"`,      `t("deleteAction")`);
  // Standalone strings that may remain
  r(`"Legg til filial"`,  `t("add")`);
  r(`"Avbryt"`,           `t("cancel")`);
  r(`"Slett"`,            `t("deleteAction")`);
  r(`"Lagre endringer"`,  `t("save")`);
  return src;
});

patch("components/BusinessForm.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("businessForm"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("businessForm");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  // Tabs
  r(`"Basic info"`,         `t("tabs.basicInfo")`);
  r(`"Media"`,              `t("tabs.media")`);
  r(`"Location"`,           `t("tabs.location")`);
  r(`"Contact"`,            `t("tabs.contact")`);
  r(`"Opening hours"`,      `t("tabs.openingHours")`);
  r(`"Services"`,           `t("tabs.services")`);
  // Day names
  r(`"Monday"`,    `t("days.monday")`);
  r(`"Tuesday"`,   `t("days.tuesday")`);
  r(`"Wednesday"`, `t("days.wednesday")`);
  r(`"Thursday"`,  `t("days.thursday")`);
  r(`"Friday"`,    `t("days.friday")`);
  r(`"Saturday"`,  `t("days.saturday")`);
  r(`"Sunday"`,    `t("days.sunday")`);
  // Placeholders
  r(`placeholder="e\\.g\\. Oslo Auto Repair"`, `placeholder={t("placeholders.name")}`);
  r(`"Select a category"`,  `t("placeholders.selectCategory")`);
  r(`placeholder="Tell customers[^"]*"`,        `placeholder={t("placeholders.description")}`);
  r(`placeholder="e\\.g\\. Karl Johans gate 1"`, `placeholder={t("placeholders.address")}`);
  r(`placeholder="Oslo"`,   `placeholder={t("placeholders.city")}`);
  r(`placeholder="0154"`,   `placeholder={t("placeholders.postalCode")}`);
  r(`"Paste the share URL from Google Maps[^"]*"`, `t("placeholders.mapsUrlHint")`);
  r(`placeholder="59\\.9139"`,  `placeholder={t("placeholders.latitude")}`);
  r(`placeholder="10\\.7522"`,  `placeholder={t("placeholders.longitude")}`);
  r(`placeholder="\\+47 123 45 678"`, `placeholder={t("placeholders.phone")}`);
  r(`placeholder="contact@business\\.no"`, `placeholder={t("placeholders.email")}`);
  r(`placeholder="https://www\\.yourbusiness\\.no"`, `placeholder={t("placeholders.website")}`);
  r(`placeholder="https://booking\\.yourbusiness\\.no"`, `placeholder={t("placeholders.bookingUrl")}`);
  r(`placeholder="Oil change"`, `placeholder={t("placeholders.serviceName")}`);
  r(`placeholder="499 kr"`,    `placeholder={t("placeholders.servicePrice")}`);
  r(`placeholder="Short description of this service \\(optional\\)"`, `placeholder={t("placeholders.serviceDescription")}`);
  // Hints
  r(`"Square image, 400×400 px recommended[^"]*"`, `t("hints.logo")`);
  r(`"Banner shown at the top[^"]*"`,              `t("hints.cover")`);
  r(`"Additional photos of your premises[^"]*"`,   `t("hints.photos")`);
  r(`"A direct link for customers to book[^"]*"`,  `t("hints.bookingUrl")`);
  r(`"Set your weekly schedule[^"]*"`,             `t("hints.openingHours")`);
  r(`"List what you offer[^"]*"`,                  `t("hints.services")`);
  r(`"GPS coordinates \\(optional\\)"`,            `t("labels.gpsCoordinates")`);
  // Actions
  r(`"Change logo"`,    `t("actions.changeLogo")`);
  r(`"Upload logo"`,    `t("actions.uploadLogo")`);
  r(`"No cover image"`, `t("actions.noCoverImage")`);
  r(`"Change cover"`,   `t("actions.changeCover")`);
  r(`"Upload cover"`,   `t("actions.uploadCover")`);
  r(`"Add photos"`,     `t("actions.addPhotos")`);
  r(`"Add service"`,    `t("actions.addService")`);
  r(`title="Remove service"`, `title={t("actions.removeService")}`);
  r(`"Save changes"`,   `t("actions.save")`);
  r(`"Create profile"`, `t("actions.create")`);
  r(`"Preview profile"`, `t("actions.preview")`);
  // Remove buttons
  r(`>Remove<`,         `>{t("actions.removeLogo")}<`);
  // Open state
  r(`"Open"`,           `t("openState.open")`);
  r(`"Closed"`,         `t("openState.closed")`);
  r(`"Not available"`,  `t("openState.notAvailable")`);
  // Services empty
  r(`"No services yet\\. Add your first one below\\."`, `t("noServices")`);
  // Status
  r(`"Profile approved"`, `t("status.approved")`);
  r(`"Your business is live and visible to the public\\."`, `t("status.approvedDesc")`);
  r(`"Pending review"`,   `t("status.pending")`);
  r(`"An admin will review your profile shortly[^"]*"`, `t("status.pendingDesc")`);
  r(`"Profile rejected"`, `t("status.rejected")`);
  r(`"Please update your information and save again[^"]*"`, `t("status.rejectedDesc")`);
  return src;
});

patch("components/BusinessTable.tsx", (src) => {
  src = ensureUseTranslations(src);
  if (!src.includes('useTranslations("businessTable"')) {
    src = src.replace(
      /export default function\s+\w+[^{]*\{/,
      (m) => `${m}\n  const t = useTranslations("businessTable");`
    );
  }
  const r = (from, to) => { src = src.replace(new RegExp(from, "g"), to); };
  // Status badges
  r(`"Approved"`,  `t("status.approved")`);
  r(`"Pending"`,   `t("status.pending")`);
  r(`"Rejected"`,  `t("status.rejected")`);
  // Delete dialog
  r(`"Delete business\\?"`, `t("deleteConfirm")`);
  r(`"and all its data will be permanently deleted\\. This cannot be undone\\."`, `t("deleteWarning")`);
  r(`"Cancel"`,    `t("cancel")`);
  r(`"Delete"`,    `t("delete")`);
  r(`"Deleting…"`, `t("deleting")`);
  // Columns
  r(`"Owner"`,     `t("columns.owner")`);
  r(`"Name"`,      `t("columns.name")`);
  r(`"Email"`,     `t("columns.email")`);
  r(`"Plan"`,      `t("columns.plan")`);
  r(`"Free"`,      `t("columns.free")`);
  r(`"Category"`,  `t("columns.category")`);
  r(`"City"`,      `t("columns.city")`);
  r(`"Phone"`,     `t("columns.phone")`);
  r(`"Website"`,   `t("columns.website")`);
  r(`"Created"`,   `t("columns.created")`);
  r(`"Updated"`,   `t("columns.updated")`);
  r(`"Category / City"`, `t("columns.categoryCity")`);
  r(`"Status"`,    `t("columns.status")`);
  r(`"Submitted"`, `t("columns.submitted")`);
  r(`"Actions"`,   `t("columns.actions")`);
  r(`"Business"`,  `t("columns.business")`);
  // Sections
  r(`"Business details"`, `t("sections.businessDetails")`);
  r(`"Engagement"`, `t("sections.engagement")`);
  r(`"Views"`,      `t("sections.views")`);
  r(`"Favourites"`, `t("sections.favorites")`);
  r(`"Reviews"`,    `t("sections.reviews")`);
  r(`"Description"`, `t("sections.description")`);
  r(`"Services"`,   `t("sections.services")`);
  r(`"Gallery"`,    `t("sections.gallery")`);
  // Actions
  r(`"Approve"`,   `t("actions.approve")`);
  r(`"Reject"`,    `t("actions.reject")`);
  r(`"View live"`, `t("actions.viewLive")`);
  r(`"Details"`,   `t("actions.details")`);
  // Empty states
  r(`"No businesses yet"`, `t("empty.none")`);
  r(`"Businesses will appear here once owners register\\."`, `t("empty.noneDesc")`);
  r(`"No pending reviews"`, `t("empty.noPending")`);
  r(`"All submissions have been reviewed\\. Great work!"`, `t("empty.noPendingDesc")`);
  r(`"No approved businesses"`, `t("empty.noApproved")`);
  r(`"Approve pending submissions to make them public\\."`, `t("empty.noApprovedDesc")`);
  r(`"No rejected businesses"`, `t("empty.noRejected")`);
  r(`"No businesses have been rejected\\."`, `t("empty.noRejectedDesc")`);
  // Search + results
  r(`placeholder="Search name, owner, city…"`, `placeholder={t("searchPlaceholder")}`);
  r(`"result"`,    `t("resultSingular")`);
  r(`"results"`,   `t("resultPlural")`);
  r(`"Unnamed"`,   `t("unnamed")`);
  r(`"No category"`, `t("noCategory")`);
  return src;
});

// ─────────────────────────────────────────────────────────────────────────────
// Done
// ─────────────────────────────────────────────────────────────────────────────
console.log(`
✅ apply_i18n complete.

Next steps:
  npm run build
  npx tsc --noEmit

If build fails, paste errors here.
`);
