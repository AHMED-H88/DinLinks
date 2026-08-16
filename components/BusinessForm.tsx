"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  COMPANY_SIZES,
  SERVICE_MODES,
  HIGHLIGHT_CODES,
  IDENTITY_SUMMARY_MAX,
  FOUNDED_YEAR_MIN,
} from "@/lib/business-fields";
import { topLevelOrder, subOrder } from "@/lib/taxonomy-v1";
import { uuidv4, uuidHex } from "@/lib/uuid";
import styles from "./BusinessForm.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;
}

interface Business {
  id: string;
  userId: string;
  name: string | null;
  description: string | null;
  categoryId: string | null;
  logo: string | null;
  coverImage: string | null;
  images: string[];
  services: ServiceItem[] | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bookingLink: string | null;
  mapLink: string | null;
  openingHours: any;
  status: "PENDING" | "APPROVED" | "REJECTED";
  // Step A1 — company information
  companyStory?: string | null;
  identitySummaryNo?: string | null;
  identitySummaryEn?: string | null;
  foundedYear?: number | null;
  companySize?: string | null;
  employeeCount?: number | null;
  serviceModes?: string[] | null;
  organizationNumber?: string | null;
  legalName?: string | null;
  organizationType?: string | null;
  highlightCodes?: string[] | null;
}

interface Category {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
}

interface BusinessFormProps {
  business: Business | null;
  categories: Category[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const defaultOpeningHours = {
  monday:    { open: "09:00", close: "17:00", closed: false },
  tuesday:   { open: "09:00", close: "17:00", closed: false },
  wednesday: { open: "09:00", close: "17:00", closed: false },
  thursday:  { open: "09:00", close: "17:00", closed: false },
  friday:    { open: "09:00", close: "17:00", closed: false },
  saturday:  { open: "10:00", close: "14:00", closed: false },
  sunday:    { open: "",      close: "",       closed: true  },
};

const SECTIONS = [
  { id: "basics",   labelKey: "basicInfo" },
  { id: "company",  labelKey: "about" },
  { id: "media",    labelKey: "media" },
  { id: "location", labelKey: "locationContact" },
  { id: "hours",    labelKey: "openingHours" },
  { id: "services", labelKey: "services" },
] as const;


// ─── Field validation ─────────────────────────────────────────────────────────
// The editor keeps all six sections mounted and hides the inactive ones, and a
// collapsed <details> hides the GPS fields even inside the active section. The
// browser cannot focus a hidden invalid control, so native constraint
// validation refuses to submit without reporting anything — a silent dead end.
// The form is therefore `noValidate` and every blocking rule lives here, so the
// save flow can surface a localised error and reveal the offending section.
// Semantic input types (email/url/tel/number) are kept for keyboards and hints.

/** Deliberately permissive — the API and a real send are the true authority. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A user-enterable web address: parseable and served over http(s). */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** Mirrors the integer bounds enforced in lib/business-fields.ts. */
function isIntegerInRange(raw: string, min: number, max: number): boolean {
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max;
}

function isNumberInRange(n: number, min: number, max: number): boolean {
  return Number.isFinite(n) && n >= min && n <= max;
}


// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Upload a single image file; returns the permanent public URL. */
async function uploadFile(
  file: File,
  bucket: "logos" | "images",
  businessId: string
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("bucket", bucket);
  form.append("businessId", businessId);

  const res  = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Fire-and-forget — never throws so it never blocks the UI.
 */
async function deleteStorageFile(url: string): Promise<void> {
  if (!url) return;
  try {
    await fetch("/api/upload", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ url }),
    });
  } catch {
    // Best-effort cleanup — log silently, never surface to user
    console.warn("[BusinessForm] storage cleanup failed for:", url);
  }
}

// ─── Small reusable bits ──────────────────────────────────────────────────────

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div id={id}>
      <h3 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
      {children}
      {required && <span className="text-gray-400 ml-0.5 font-normal">*</span>}
    </label>
  );
}

function Spinner({ small }: { small?: boolean }) {
  return (
    <svg
      className={`animate-spin ${small ? "h-4 w-4" : "h-5 w-5"}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BusinessForm({ business, categories }: BusinessFormProps) {
  const router  = useRouter();
  const t       = useTranslations("businessForm");
  const tCat    = useTranslations("categories");
  const locale  = useLocale();
  const isEdit  = !!business;

  // Stable UUID for new businesses — used as the storage folder path before
  // the first save. It must be unpredictable (unlike useId, which generates
  // short sequential strings like "r0", "r1"). uuidHex keeps the hyphen-free
  // 32-character shape the upload path expects, and unlike crypto.randomUUID
  // it also works on the insecure-origin LAN URLs used for device testing.
  const [tempId]   = useState(() => uuidHex());
  const businessId = business?.id ?? tempId;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name,         setName]        = useState(business?.name         ?? "");
  const [description,  setDescription] = useState(business?.description  ?? "");
  const [categoryId,   setCategoryId]  = useState(business?.categoryId   ?? "");
  // ── Two-level category selection (Taxonomy v1) ───────────────────────────────
  // Pick a top-level Category first, then one Subcategory. Only the Subcategory
  // id is submitted as categoryId; the parent is derived from it.
  const topLevelCategories = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => topLevelOrder(a.slug ?? "") - topLevelOrder(b.slug ?? ""));
  const allSubcategories = categories.filter((c) => c.parentId);
  const [topLevelId, setTopLevelId] = useState(
    allSubcategories.find((c) => c.id === (business?.categoryId ?? ""))?.parentId ?? ""
  );
  const [logo,         setLogo]        = useState(business?.logo         ?? "");
  const [coverImage,   setCoverImage]  = useState(business?.coverImage   ?? "");
  const [images,       setImages]      = useState<string[]>(business?.images ?? []);
  const [services,     setServices]    = useState<ServiceItem[]>(
    Array.isArray(business?.services) ? (business!.services as ServiceItem[]) : []
  );
  const [address,      setAddress]     = useState(business?.address      ?? "");
  const [city,         setCity]        = useState(business?.city         ?? "");
  const [postalCode,   setPostalCode]  = useState(business?.postalCode   ?? "");
  const [latitude,     setLatitude]    = useState<number | null>(business?.latitude  ?? null);
  const [longitude,    setLongitude]   = useState<number | null>(business?.longitude ?? null);
  const [phone,        setPhone]       = useState(business?.phone        ?? "");
  const [email,        setEmail]       = useState(business?.email        ?? "");
  const [website,      setWebsite]     = useState(business?.website      ?? "");
  const [bookingLink,  setBookingLink] = useState(business?.bookingLink  ?? "");
  const [mapLink,      setMapLink]     = useState(business?.mapLink      ?? "");
  const [openingHours, setOpeningHours] = useState<Record<string, any>>(
    business?.openingHours && typeof business.openingHours === "object"
      ? (business.openingHours as Record<string, any>)
      : defaultOpeningHours
  );

  // ── Step A1 — company information state (all optional) ────────────────────────
  const [companyStory,       setCompanyStory]       = useState(business?.companyStory ?? "");
  const [identitySummaryNo,  setIdentitySummaryNo]  = useState(business?.identitySummaryNo ?? "");
  const [identitySummaryEn,  setIdentitySummaryEn]  = useState(business?.identitySummaryEn ?? "");
  const [foundedYear,        setFoundedYear]        = useState(business?.foundedYear != null ? String(business.foundedYear) : "");
  const [companySize,        setCompanySize]        = useState(business?.companySize ?? "");
  const [employeeCount,      setEmployeeCount]      = useState(business?.employeeCount != null ? String(business.employeeCount) : "");
  const [legalName,          setLegalName]          = useState(business?.legalName ?? "");
  const [organizationNumber, setOrganizationNumber] = useState(business?.organizationNumber ?? "");
  const [organizationType,   setOrganizationType]   = useState(business?.organizationType ?? "");
  const [serviceModes,       setServiceModes]       = useState<string[]>(business?.serviceModes ?? []);
  const [highlightCodes,     setHighlightCodes]     = useState<string[]>(business?.highlightCodes ?? []);

  function toggleInList(list: string[], setter: (v: string[]) => void, value: string) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(false);
  const [logoUploading,   setLogoUploading]   = useState(false);
  const [coverUploading,  setCoverUploading]  = useState(false);
  const [imageUploading,  setImageUploading]  = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");
  const [activeSection,   setActiveSection]   = useState<string>("basics");
  const activeIndex   = SECTIONS.findIndex((s) => s.id === activeSection);
  const isLastSection = activeIndex === SECTIONS.length - 1;

  const logoInputRef   = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const navRef         = useRef<HTMLElement>(null);
  const editorRef      = useRef<HTMLDivElement>(null);

  // The tab strip scrolls horizontally on narrow screens, so a section reached
  // via Save and continue / Previous can sit outside the visible run. Nudge the
  // strip just far enough to reveal it. Only the strip is scrolled — never the
  // page — so this is inert on desktop, where nothing overflows.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!nav || !active) return;

    // Enough overshoot that a sliver of the neighbouring tab stays visible, so
    // the strip reads as a run of sections rather than ending at the active one.
    const GUTTER = 40;
    // Compare rectangles rather than offsetLeft: the tabs' offsetParent is not
    // the strip (it is not positioned), so offset maths would use the wrong
    // origin. Deltas fed to scrollBy are origin-independent.
    const strip = nav.getBoundingClientRect();
    const tab   = active.getBoundingClientRect();

    // Only move when the active tab is actually out of view — no recentring
    // while it is already comfortably visible.
    if (tab.left < strip.left) {
      nav.scrollBy({ left: tab.left - strip.left - GUTTER, behavior: "auto" });
    } else if (tab.right > strip.right) {
      nav.scrollBy({ left: tab.right - strip.right + GUTTER, behavior: "auto" });
    }
  }, [activeSection]);

  // ── Continue-scrolling into the next section (touch only) ───────────────────
  // One section shows at a time, but reaching the end of one should not feel
  // like a wall. Once the page is scrolled to the bottom, further *finger*
  // movement accumulates; past a deliberate threshold the editor advances one
  // section. Navigation only — nothing is saved and no form state is touched.
  //
  // Reading touchmove rather than scroll position is what makes this safe on
  // iOS Safari: momentum after a flick fires scroll events but no touchmove, so
  // a hard flick cannot skip ahead; rubber-band overscroll only accumulates
  // while the finger is still down, which is genuine intent; and a keyboard
  // opening or closing resizes the viewport without any touchmove at all.
  const pullRef              = useRef(0);
  const lastTouchY           = useRef<number | null>(null);
  const advanceLock          = useRef(false);

  // Bring the start of the new section into view when the section changes —
  // by gesture, tab tap, Previous or Save and continue. The strip is sticky at
  // every width now, so this runs at every width too. It stays unobtrusive by
  // firing only when the editor has already scrolled up past the header: a
  // user still near the top is never yanked, and the page heading is never
  // forced out of view for no reason.
  //
  // The target is the sticky offset rather than viewport zero: aligning the
  // editor top with the header leaves the strip exactly where it sticks, with
  // the section content beginning just below it instead of behind it.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const headerOffset =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--app-header-height"),
      ) || 0;

    const top = editor.getBoundingClientRect().top;
    if (top >= headerOffset - 1) return; // already at or below the sticky stack

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: window.scrollY + top - headerOffset,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeSection]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Desktop keeps tabs / Previous / Save and continue; no scroll hijacking.
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    // The last section has nowhere to advance to: normal end of page.
    if (isLastSection) return;

    const BOTTOM_SLACK    = 4;   // px of tolerance for "at the bottom"
    const PULL_THRESHOLD  = 80;  // px of finger travel past the bottom
    const RELOCK_MS       = 800;

    const atBottom = () =>
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - BOTTOM_SLACK;

    const reset = () => { pullRef.current = 0; lastTouchY.current = null; };

    const onTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0]?.clientY ?? null;
      pullRef.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y == null) return;
      const previous = lastTouchY.current;
      lastTouchY.current = y;
      if (previous == null || advanceLock.current) return;

      const delta = previous - y; // finger travelling up = scrolling down
      // Only movement made *while already at the bottom* counts, so the user
      // can reach the actions, pause, read and tap them without advancing.
      if (delta <= 0 || !atBottom()) {
        pullRef.current = 0;
        return;
      }

      pullRef.current += delta;
      if (pullRef.current < PULL_THRESHOLD) return;

      advanceLock.current = true;
      reset();
      // The reveal runs from the effect above, after React has swapped the
      // section in — scrolling here would measure the outgoing layout.
      setActiveSection(SECTIONS[activeIndex + 1].id);

      // Hold the lock past the reveal so one gesture advances exactly one
      // section, however much momentum follows it.
      window.setTimeout(() => { advanceLock.current = false; }, RELOCK_MS);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", reset, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", reset);
      window.removeEventListener("touchcancel", reset);
    };
  }, [activeIndex, isLastSection]);

  // ── Opening hours helper ────────────────────────────────────────────────────
  function updateHours(day: string, field: string, value: string | boolean) {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  // ── Services helpers ────────────────────────────────────────────────────────
  function addService() {
    setServices((prev) => [
      ...prev,
      { id: uuidv4(), name: "", description: "", price: "" },
    ]);
  }

  function updateService(id: string, field: keyof ServiceItem, value: string) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  // ── Upload handlers ─────────────────────────────────────────────────────────

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previousUrl = logo; // capture before state changes
    setLogoUploading(true);
    setError("");

    try {
      const url = await uploadFile(file, "logos", businessId);
      setLogo(url);
      // Delete the old logo from storage after the new one is confirmed uploaded
      if (previousUrl) deleteStorageFile(previousUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.logoUpload"));
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previousUrl = coverImage;
    setCoverUploading(true);
    setError("");

    try {
      const url = await uploadFile(file, "images", businessId);
      setCoverImage(url);
      if (previousUrl) deleteStorageFile(previousUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.coverUpload"));
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImageUploading(true);
    setError("");

    try {
      const urls = await Promise.all(
        files.map((f) => uploadFile(f, "images", businessId))
      );
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.imageUpload"));
    } finally {
      setImageUploading(false);
      if (imagesInputRef.current) imagesInputRef.current.value = "";
    }
  }

  /** Remove a gallery image: update state immediately, delete from storage. */
  function removeGalleryImage(url: string, idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    deleteStorageFile(url); // fire-and-forget
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function doSave(): Promise<boolean> {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(t("errors.nameRequired"));
      setActiveSection("basics");
      return false;
    }

    // A business must belong to exactly one Subcategory (never a top-level).
    if (!categoryId || !allSubcategories.some((c) => c.id === categoryId)) {
      setError(t("subcategoryRequired"));
      setActiveSection("basics");
      return false;
    }

    // Fields the browser can no longer block on (the form is `noValidate` —
    // see the Field validation note above). Optional fields stay valid while
    // empty; checks run in section order so the user is sent to the earliest
    // problem rather than an arbitrary one.
    const checks: { invalid: boolean; section: string; messageKey: string }[] = [
      // 2. About the business
      {
        invalid:
          foundedYear.trim() !== "" &&
          !isIntegerInRange(foundedYear.trim(), FOUNDED_YEAR_MIN, new Date().getFullYear()),
        section: "company",
        messageKey: "foundedYearRange",
      },
      {
        invalid:
          employeeCount.trim() !== "" &&
          !isIntegerInRange(employeeCount.trim(), 0, Number.MAX_SAFE_INTEGER),
        section: "company",
        messageKey: "employeeCountRange",
      },
      // 4. Location & contact
      {
        invalid: mapLink.trim() !== "" && !isHttpUrl(mapLink.trim()),
        section: "location",
        messageKey: "mapsUrlInvalid",
      },
      {
        invalid: latitude !== null && !isNumberInRange(latitude, -90, 90),
        section: "location",
        messageKey: "latitudeRange",
      },
      {
        invalid: longitude !== null && !isNumberInRange(longitude, -180, 180),
        section: "location",
        messageKey: "longitudeRange",
      },
      {
        invalid: email.trim() !== "" && !EMAIL_RE.test(email.trim()),
        section: "location",
        messageKey: "emailInvalid",
      },
      {
        invalid: website.trim() !== "" && !isHttpUrl(website.trim()),
        section: "location",
        messageKey: "websiteInvalid",
      },
      {
        invalid: bookingLink.trim() !== "" && !isHttpUrl(bookingLink.trim()),
        section: "location",
        messageKey: "bookingUrlInvalid",
      },
    ];

    const failed = checks.find((c) => c.invalid);
    if (failed) {
      setError(t(`errors.${failed.messageKey}` as any));
      setActiveSection(failed.section);
      return false;
    }

    setLoading(true);
    try {
      const payload = {
        name:         name.trim(),
        description:  description.trim(),
        categoryId:   categoryId || null,
        logo:         logo || null,
        coverImage:   coverImage || null,
        images,
        services,
        address:      address.trim()     || null,
        city:         city.trim()        || null,
        postalCode:   postalCode.trim()  || null,
        latitude,
        longitude,
        phone:        phone.trim()       || null,
        email:        email.trim()       || null,
        website:      website.trim()     || null,
        bookingLink:  bookingLink.trim() || null,
        mapLink:      mapLink.trim()     || null,
        openingHours,
        // Step A1 — company information (optional; server validates + normalises)
        companyStory:       companyStory.trim() || null,
        identitySummaryNo:  identitySummaryNo.trim() || null,
        identitySummaryEn:  identitySummaryEn.trim() || null,
        foundedYear:        foundedYear.trim()   === "" ? null : Number(foundedYear),
        companySize:        companySize || null,
        employeeCount:      employeeCount.trim() === "" ? null : Number(employeeCount),
        legalName:          legalName.trim() || null,
        organizationNumber: organizationNumber.trim() || null,
        organizationType:   organizationType.trim() || null,
        serviceModes,
        highlightCodes,
      };

      const res  = await fetch("/api/business", {
        method:  isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        // Category (Subcategory) validation returns a stable `code` we localise
        // via businessForm.categoryErrors.*, so NO/EN users see native text.
        const categoryMsg =
          data.field === "categoryId" && typeof data.code === "string"
            ? t(`categoryErrors.${data.code}` as any)
            : null;
        // Field-level validation errors from the API carry a message key we
        // can localise; fall back to the generic message otherwise.
        const fieldMsg =
          Array.isArray(data.fields) && data.fields[0]?.message
            ? t(`errors.${data.fields[0].message}` as any)
            : null;
        setError(categoryMsg ?? fieldMsg ?? data.error ?? t("errors.generic"));
        return false;
      }

      setSuccess(isEdit ? t("success.updated") : t("success.created"));
      router.refresh();
      return true;
    } catch {
      setError(t("errors.network"));
      return false;
    } finally {
      setLoading(false);
    }
  }

  // Primary action: save with the existing behaviour, then (for sections 1–5)
  // advance to the next section. Direct tab clicks never trigger a save.
  async function handlePrimary(e: React.FormEvent) {
    e.preventDefault();
    const ok = await doSave();
    if (ok && !isLastSection) {
      setActiveSection(SECTIONS[activeIndex + 1].id);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div ref={editorRef} className={styles.editor}>
      {/* ── Thin, text-led section navigation — switches the active section.
             Horizontally scrollable on mobile, same model on desktop.

             It sticks directly under the site header at every width, so a
             long section never hides which section is being edited. Opaque
             background (matching the workspace surface) so fields do not read
             through it, and it sits under the header's z-50 but over content.
             On desktop it spans the centred editor frame only, leaving the
             sidebar's own sticky column alone. ── */}
      <nav
        ref={navRef}
        className="sticky top-[var(--app-header-height)] z-30 bg-gray-50 flex items-center gap-5 sm:gap-6 lg:gap-7 border-b border-gray-200 overflow-x-auto scrollbar-hide mb-8"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            aria-current={activeSection === s.id ? "true" : undefined}
            className={`whitespace-nowrap py-3 -mb-px border-b-2 text-sm transition-colors ${
              activeSection === s.id
                ? "border-gray-900 text-gray-900 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t(`tabs.${s.labelKey}`)}
          </button>
        ))}
      </nav>

      {/* ── Form body — one section rendered at a time ─────────────────── */}
      {/* `noValidate`: hidden sections make native constraint validation
          unreliable — see the Field validation note at the top of this file.
          doSave() owns every blocking rule instead. */}
      <form onSubmit={handlePrimary} noValidate className="min-w-0">
        {/* Validation / save feedback (publication state lives in the page header) */}
        <FormFeedback error={error} success={success} />

        {/* ── 1. Basic info ─────────────────────────────────────────── */}
        <section className={activeSection === "basics" ? styles.section : "hidden"}>
          <SectionHeading
            id="basics"
            title={t("sections.basics")}
            subtitle={t("subtitles.basics")}
          />
          <div className="space-y-5">
            <div>
              <FieldLabel required>{t("labels.name")}</FieldLabel>
              {/* No native `required`: inactive sections stay mounted but hidden,
                  and the browser refuses to submit a form with an empty required
                  control it cannot focus — which silently dead-ends Save from
                  sections 2–6. doSave() validates the name itself, shows a
                  localised error and returns to this section. */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder={t("placeholders.name")}
                aria-required="true"
              />
            </div>

            {/* Two-level category selection: top-level Category, then Subcategory.
                Only the Subcategory id is stored as categoryId. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>{t("labels.category")}</FieldLabel>
                <select
                  value={topLevelId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setTopLevelId(id);
                    // Clear an incompatible Subcategory when the parent changes.
                    const current = allSubcategories.find((c) => c.id === categoryId);
                    if (!current || current.parentId !== id) setCategoryId("");
                  }}
                  className="input"
                >
                  <option value="">{t("placeholders.selectCategory")}</option>
                  {topLevelCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.slug && tCat.has(c.slug) ? tCat(c.slug) : c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>{t("labels.subcategory")}</FieldLabel>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={!topLevelId}
                  className="input disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {topLevelId ? t("placeholders.selectSubcategory") : t("placeholders.selectTopLevelFirst")}
                  </option>
                  {allSubcategories
                    .filter((c) => c.parentId === topLevelId)
                    .sort((a, b) => subOrder(a.slug ?? "") - subOrder(b.slug ?? ""))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.slug && tCat.has(c.slug) ? tCat(c.slug) : c.name}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Short business description (NO / EN) — shown directly below the business
                name on the public profile; the primary customer-facing summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>{t("labels.identitySummaryNo")}</FieldLabel>
                <textarea
                  value={identitySummaryNo}
                  onChange={(e) => setIdentitySummaryNo(e.target.value)}
                  className="input min-h-[72px] resize-y"
                  rows={2}
                  maxLength={IDENTITY_SUMMARY_MAX}
                  placeholder={t("placeholders.identitySummaryNo")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("hints.identitySummary")} · {identitySummaryNo.trim().length}/{IDENTITY_SUMMARY_MAX}
                </p>
              </div>
              <div>
                <FieldLabel>{t("labels.identitySummaryEn")}</FieldLabel>
                <textarea
                  value={identitySummaryEn}
                  onChange={(e) => setIdentitySummaryEn(e.target.value)}
                  className="input min-h-[72px] resize-y"
                  rows={2}
                  maxLength={IDENTITY_SUMMARY_MAX}
                  placeholder={t("placeholders.identitySummaryEn")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("hints.identitySummary")} · {identitySummaryEn.trim().length}/{IDENTITY_SUMMARY_MAX}
                </p>
              </div>
            </div>

            {/* Full description — longer, secondary to the short summary above */}
            <div className="pt-6 border-t border-gray-100">
              <FieldLabel>{t("labels.description")}</FieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[120px] resize-y"
                rows={4}
                placeholder={t("placeholders.description")}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length} / 1000</p>
            </div>
          </div>
        </section>

        {/* ── Company information (Step A1) ─────────────────────────── */}
        <section className={activeSection === "company" ? styles.section : "hidden"}>
          <SectionHeading
            id="company"
            title={t("sections.about")}
            subtitle={t("subtitles.company")}
          />
          <div className="space-y-5">
            {/* Company story */}
            <div>
              <FieldLabel>{t("labels.companyStory")}</FieldLabel>
              <textarea
                value={companyStory}
                onChange={(e) => setCompanyStory(e.target.value)}
                className="input min-h-[120px] resize-y"
                rows={5}
                placeholder={t("placeholders.companyStory")}
              />
              <p className="text-xs text-gray-500 mt-1">{t("hints.companyStory")}</p>
            </div>

            {/* Founded year + employee count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>{t("labels.foundedYear")}</FieldLabel>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.foundedYear")}
                />
              </div>
              <div>
                <FieldLabel>{t("labels.employeeCount")}</FieldLabel>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.employeeCount")}
                />
              </div>
            </div>

            {/* Company size */}
            <div>
              <FieldLabel>{t("labels.companySize")}</FieldLabel>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="input"
              >
                <option value="">{t("companySize.none")}</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>{t(`companySize.${size}` as any)}</option>
                ))}
              </select>
            </div>

            {/* Legal name + organization number + organization type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>{t("labels.legalName")}</FieldLabel>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.legalName")}
                />
              </div>
              <div>
                <FieldLabel>{t("labels.organizationNumber")}</FieldLabel>
                <input
                  type="text"
                  inputMode="numeric"
                  value={organizationNumber}
                  onChange={(e) => setOrganizationNumber(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.organizationNumber")}
                />
                <p className="text-xs text-gray-500 mt-1">{t("hints.organizationNumber")}</p>
              </div>
            </div>

            <div>
              <FieldLabel>{t("labels.organizationType")}</FieldLabel>
              <input
                type="text"
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value)}
                className="input"
                placeholder={t("placeholders.organizationType")}
              />
            </div>

            {/* Service modes */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1.5">{t("labels.serviceModes")}</legend>
              {/* py-1 below sm only: taller tap targets, desktop unchanged. */}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {SERVICE_MODES.map((mode) => (
                  <label key={mode} className="flex items-center gap-2 py-1 sm:py-0 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={serviceModes.includes(mode)}
                      onChange={() => toggleInList(serviceModes, setServiceModes, mode)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-300"
                    />
                    {t(`serviceMode.${mode}` as any)}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Highlights */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1.5">{t("labels.highlightCodes")}</legend>
              <p className="text-xs text-gray-500 mb-2">{t("hints.highlightCodes")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
                {HIGHLIGHT_CODES.map((code) => (
                  <label key={code} className="flex items-center gap-2 py-1 sm:py-0 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={highlightCodes.includes(code)}
                      onChange={() => toggleInList(highlightCodes, setHighlightCodes, code)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-300"
                    />
                    {t(`highlight.${code}` as any)}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        {/* ── 2. Media ──────────────────────────────────────────────── */}
        <section className={activeSection === "media" ? styles.section : "hidden"}>
          <SectionHeading
            id="media"
            title={t("sections.media")}
            subtitle={t("subtitles.media")}
          />
          <div className="space-y-8">
            {/* Logo */}
            <div>
              <FieldLabel>{t("labels.logo")}</FieldLabel>
              <p className="text-xs text-gray-500 mb-3">{t("hints.logo")}</p>
              <div className="flex items-center gap-5">
                {/* Preview */}
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {logo ? (
                    <Image src={logo} alt="Logo" width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                    className="btn btn-secondary btn-sm disabled:opacity-50"
                  >
                    {logoUploading ? (
                      <span className="flex items-center gap-2"><Spinner small /> {t("uploading")}</span>
                    ) : (
                      logo ? t("actions.changeLogo") : t("actions.uploadLogo")
                    )}
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => { const old = logo; setLogo(""); deleteStorageFile(old); }}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors text-left"
                    >
                      {t("actions.removeLogo")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cover image */}
            <div>
              <FieldLabel>{t("labels.cover")}</FieldLabel>
              <p className="text-xs text-gray-500 mb-3">{t("hints.cover")}</p>
              <div className="space-y-3">
                <div className="w-full h-36 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {coverImage ? (
                    <Image src={coverImage} alt="Cover" width={800} height={200} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">{t("actions.noCoverImage")}</span>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleCoverChange}
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={coverUploading}
                    onClick={() => coverInputRef.current?.click()}
                    className="btn btn-secondary btn-sm disabled:opacity-50"
                  >
                    {coverUploading ? (
                      <span className="flex items-center gap-2"><Spinner small /> {t("uploading")}</span>
                    ) : (
                      coverImage ? t("actions.changeCover") : t("actions.uploadCover")
                    )}
                  </button>
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => { const old = coverImage; setCoverImage(""); deleteStorageFile(old); }}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      {t("actions.removeCover")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <FieldLabel>{t("photoGallery")}</FieldLabel>
              <p className="text-xs text-gray-500 mb-3">{t("hints.photos")}</p>
              <input
                ref={imagesInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImagesChange}
              />
              <button
                type="button"
                disabled={imageUploading}
                onClick={() => imagesInputRef.current?.click()}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                {imageUploading ? (
                  <span className="flex items-center gap-2"><Spinner small /> {t("uploading")}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t("actions.addPhotos")}
                  </span>
                )}
              </button>
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <Image
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        fill
                        className="object-cover rounded-xl border border-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(img, idx)}
                        // Touch screens have no hover, so the hover-reveal used
                        // on desktop would leave this unreachable: show it
                        // outright below sm, keep the desktop reveal above.
                        className="absolute top-1.5 right-1.5 w-7 h-7 sm:w-6 sm:h-6 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1.5 left-1.5 text-[10px] text-white bg-black/40 rounded px-1 opacity-0 group-hover:opacity-100 transition-all">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 3. Location ───────────────────────────────────────────── */}
        <section className={activeSection === "location" ? styles.section : "hidden"}>
          <SectionHeading
            id="location"
            title={t("sections.locationContact")}
            subtitle={t("subtitles.location")}
          />
          <div className="space-y-5">
            <div>
              <FieldLabel>{t("labels.address")}</FieldLabel>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
                placeholder={t("placeholders.address")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>{t("labels.city")}</FieldLabel>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.city")}
                />
              </div>
              <div>
                <FieldLabel>{t("labels.postalCode")}</FieldLabel>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.postalCode")}
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t("labels.mapsUrl")}</FieldLabel>
              <input
                type="url"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                className="input"
                placeholder="https://maps.google.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">{t("placeholders.mapsUrlHint")}</p>
            </div>

            <details className="group">
              <summary className="text-sm text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {t("labels.gpsCoordinates")}
              </summary>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <FieldLabel>{t("labels.latitude")}</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    value={latitude ?? ""}
                    // Number.isFinite, not `|| null`: latitude 0 is a real
                    // coordinate and must not be coerced away.
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      setLatitude(Number.isFinite(n) ? n : null);
                    }}
                    className="input"
                    placeholder={t("placeholders.latitude")}
                  />
                </div>
                <div>
                  <FieldLabel>{t("labels.longitude")}</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    value={longitude ?? ""}
                    // See latitude above — longitude 0 is equally valid.
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      setLongitude(Number.isFinite(n) ? n : null);
                    }}
                    className="input"
                    placeholder={t("placeholders.longitude")}
                  />
                </div>
              </div>
            </details>
            {/* Contact — same section, subtle divider between Location and Contact */}
            <div className="pt-6 mt-2 border-t border-gray-100 space-y-5">
              <h4 className="text-sm font-semibold text-gray-800">{t("sections.contact")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>{t("labels.phone")}</FieldLabel>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder={t("placeholders.phone")}
                  />
                </div>
                <div>
                  <FieldLabel>{t("labels.email")}</FieldLabel>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder={t("placeholders.email")}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{t("labels.website")}</FieldLabel>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.website")}
                />
              </div>

              <div>
                <FieldLabel>{t("labels.bookingUrl")}</FieldLabel>
                <input
                  type="url"
                  value={bookingLink}
                  onChange={(e) => setBookingLink(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.bookingUrl")}
                />
                <p className="text-xs text-gray-500 mt-1">{t("hints.bookingUrl")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Opening hours ──────────────────────────────────────── */}
        <section className={activeSection === "hours" ? styles.section : "hidden"}>
          <SectionHeading
            id="hours"
            title={t("sections.hours")}
            subtitle={t("hints.openingHours")}
          />
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {DAYS.map((day) => {
              const h = openingHours[day] ?? { open: "", close: "", closed: false };
              return (
                <div
                  key={day}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3"
                >
                  {/* Day and state share the first line on narrow screens so a
                      day costs two lines rather than three. `sm:contents`
                      dissolves this wrapper at sm+, restoring the approved
                      flat desktop row exactly. */}
                  <div className="flex items-center justify-between gap-3 sm:contents">
                    {/* Day name */}
                    <span className={`sm:w-28 text-sm font-medium flex-shrink-0 ${h.closed ? "text-gray-400" : "text-gray-800"}`}>
                      {t(`days.${day}`)}
                    </span>

                    {/* Closed toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                      <div
                        onClick={() => updateHours(day, "closed", !h.closed)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${h.closed ? "bg-gray-300" : "bg-gray-900"}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${h.closed ? "" : "translate-x-4"}`} />
                      </div>
                      <span className={`text-xs font-medium ${h.closed ? "text-gray-400" : "text-gray-900"}`}>
                        {h.closed ? t("openState.closed") : t("openState.open")}
                      </span>
                    </label>
                  </div>

                  {/* Time inputs */}
                  {!h.closed && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => updateHours(day, "open", e.target.value)}
                        className="input py-1.5 px-3 text-sm flex-1 min-w-0"
                      />
                      <span className="text-gray-400 text-sm font-medium">–</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => updateHours(day, "close", e.target.value)}
                        className="input py-1.5 px-3 text-sm flex-1 min-w-0"
                      />
                    </div>
                  )}
                  {/* Redundant on mobile — the toggle beside the day already
                      reads Closed / Stengt — so it only shows from sm up. */}
                  {h.closed && (
                    <span className="hidden sm:inline text-sm text-gray-400 italic">{t("openState.notAvailable")}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. Services ───────────────────────────────────────────── */}
        <section className={activeSection === "services" ? styles.section : "hidden"}>
          <SectionHeading
            id="services"
            title={t("sections.services")}
            subtitle={t("hints.services")}
          />
          <div>
            {services.length === 0 && (
              <p className="text-sm text-gray-400 py-1">{t("noServices")}</p>
            )}

            {services.length > 0 && (
              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {services.map((svc, idx) => (
                  <div key={svc.id} className="group relative flex items-start gap-3 sm:gap-4 py-5">
                    <span className="w-6 flex-shrink-0 pt-2.5 text-xs font-semibold text-gray-400 tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <FieldLabel>{t("labels.serviceName")}</FieldLabel>
                          <input
                            type="text"
                            value={svc.name}
                            onChange={(e) => updateService(svc.id, "name", e.target.value)}
                            className="input"
                            placeholder={t("placeholders.serviceName")}
                          />
                        </div>
                        <div>
                          <FieldLabel>{t("labels.price")}</FieldLabel>
                          <input
                            type="text"
                            value={svc.price}
                            onChange={(e) => updateService(svc.id, "price", e.target.value)}
                            className="input"
                            placeholder={t("placeholders.servicePrice")}
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>{t("labels.description")}</FieldLabel>
                        <input
                          type="text"
                          value={svc.description}
                          onChange={(e) => updateService(svc.id, "description", e.target.value)}
                          className="input"
                          placeholder={t("placeholders.serviceDescription")}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeService(svc.id)}
                      // Wider tap target below sm; the desktop box stays 32px.
                      className="w-10 h-10 sm:w-8 sm:h-8 mt-1.5 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 focus:text-red-600 transition-colors flex-shrink-0"
                      title={t("actions.removeService")}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-2 mt-5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("actions.addService")}
            </button>
          </div>
        </section>

        {/* ── Section action area — Previous / Save (and continue) / Preview ── */}
        <div className="flex flex-wrap items-center gap-3 pt-6 mt-10 border-t border-gray-200">
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={() => setActiveSection(SECTIONS[activeIndex - 1].id)}
              className="btn btn-secondary"
            >
              {t("actions.previous")}
            </button>
          )}

          {/* Below sm this group takes its own line under Previous and stacks:
              the Norwegian labels are too long to sit side by side at 320px, and
              stretching both keeps the primary save strongest and thumb-reachable.
              At sm+ it is the original single row. */}
          <div className="ml-auto flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            {isEdit && business.status === "APPROVED" && (
              <a
                href={`/${locale}/business/${business.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary inline-flex items-center justify-center gap-2 sm:flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                {t("actions.preview")}
              </a>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary sm:min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner small /> {t("savingState")}
                </span>
              ) : isLastSection ? (
                isEdit ? t("actions.save") : t("actions.create")
              ) : (
                t("actions.saveAndContinue")
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Status banners sub-component ─────────────────────────────────────────────

function FormFeedback({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  return (
    <div className="space-y-3 empty:hidden mb-2">
      {/* Success */}
      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
