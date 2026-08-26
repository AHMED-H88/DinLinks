"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  COMPANY_SIZES,
  DELIVERY_METHODS,
  SERVICE_AREAS,
  HIGHLIGHT_MAX_COUNT,
  HIGHLIGHT_MAX_LENGTH,
  IDENTITY_SUMMARY_MAX,
  SERVICE_NAME_MAX,
  SERVICE_DESCRIPTION_MAX,
  FOUNDED_YEAR_MIN,
  EXCEPTIONAL_HOURS_MAX_COUNT,
  normalizeHighlights,
  normalizeExceptionalHours,
  type ExceptionalMode,
  type HideableField,
  type HighlightItem,
} from "@/lib/business-fields";
import FocusedTextarea from "@/components/FocusedTextarea";
import ImageLightbox from "@/components/ImageLightbox";
import Select from "@/components/Select";
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
  // Stage 1 — profile control fields
  hiddenFields?: string[] | null;
  deliveryMethods?: string[] | null;
  serviceArea?: string | null;
  /** `[{ no, en }, …]` — normalised on read, so `unknown` here is honest. */
  highlights?: unknown;
  /** `[{ date, mode, open, close, label, holiday }, …]`, normalised on read. */
  exceptionalHours?: unknown;
}

/**
 * One exceptional date as the editor holds it.
 *
 * The stored shape (lib/business-fields.ts) carries `open`/`close` as
 * `string | null`; a controlled input needs `""`. `label` and `holiday` are not
 * edited here — they belong to the public profile's naming of a date — and are
 * carried through untouched so a save from this editor never drops them.
 */
type ExceptionalRow = {
  date: string;
  mode: ExceptionalMode;
  open: string;
  close: string;
  label: string | null;
  holiday: string | null;
};

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

/**
 * Refuses page scrolling while a gallery tile is being carried.
 *
 * Declared at module scope on purpose. addEventListener and removeEventListener
 * match on the function object, a drag re-renders several times, and a handler
 * declared inside the component would be added as one object and "removed" as
 * another — leaving the real one attached to window, refusing every touchmove
 * on the page for the rest of the session.
 */
const blockTouchScroll = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };

/**
 * The window-level safety net for a drag that never gets its own pointerup —
 * the tile re-rendered away, the gesture ended off-element.
 *
 * The listeners are constants and the work is reached through a mutable record,
 * rather than the listeners themselves being reassigned. addEventListener stores
 * the function object it was handed, so a reassigned handler would be removed by
 * a reference that was never added — the same trap as above, and one that would
 * otherwise be hidden behind whether a useCallback's dependencies happened to
 * stay stable.
 */
const dragEndCallbacks = { end: () => {}, cancel: () => {} };
const endDragFromWindow    = () => dragEndCallbacks.end();
const cancelDragFromWindow = () => dragEndCallbacks.cancel();

/** Ties the header's Save button to the form it submits. */
const FORM_ID = "business-profile-form";

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

/**
 * A field label with its visibility control on the same line.
 *
 * One quiet text button rather than a switch: the About section has six
 * hideable fields, and six switches would read as a settings panel sitting on
 * top of the content. The button says what it will do, and a line under the
 * field states the current state when it is hidden — so nothing has to be
 * inferred from a control's position.
 */
function LabelRow({
  label,
  hidden,
  onToggle,
  labels,
}: {
  label: React.ReactNode;
  hidden: boolean;
  onToggle: () => void;
  labels: { hide: string; show: string; hideTitle: string; showTitle: string };
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-1.5">
      <label className="block text-sm font-semibold text-gray-800">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={hidden}
        title={hidden ? labels.showTitle : labels.hideTitle}
        className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 decoration-gray-300 hover:decoration-gray-500 transition-colors flex-shrink-0"
      >
        {hidden ? labels.show : labels.hide}
      </button>
    </div>
  );
}

/** The "this is hidden" line under a field. Absent while the field is public. */
function HiddenNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1">{children}</p>;
}

/**
 * A checkbox drawn by the app rather than the browser.
 *
 * The native control renders at ~13px in the platform's accent colour, which
 * was both the smallest target on the page and the second place the operating
 * system's palette showed through. The real input stays in the DOM and keeps
 * every native behaviour — label association, keyboard, form semantics — and
 * is only visually replaced; `peer` drives the drawn box from its checked and
 * focus state, so nothing is reimplemented in JavaScript.
 */
function CheckOption({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="group flex items-center gap-2.5 py-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className="w-[18px] h-[18px] flex-shrink-0 rounded-[5px] border border-gray-300 bg-white flex items-center justify-center transition-colors
                   group-hover:border-gray-400
                   peer-checked:bg-gray-900 peer-checked:border-gray-900
                   peer-focus-visible:ring-2 peer-focus-visible:ring-gray-300 peer-focus-visible:ring-offset-1"
      >
        <svg
          className={`w-3 h-3 text-white transition-opacity ${checked ? "opacity-100" : "opacity-0"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className={`text-sm transition-colors ${checked ? "text-gray-900 font-medium" : "text-gray-600"}`}>
        {label}
      </span>
    </label>
  );
}

/**
 * Reorder and remove controls for one highlight row.
 *
 * Rendered twice per row — once above the inputs below sm, once beside them
 * from sm up — because at 375px two text inputs and three buttons cannot share
 * a line without every one of them becoming unusable. Only one copy is ever
 * displayed; the other is display:none and so is out of the layout and out of
 * the accessibility tree.
 */
/**
 * The open/closed switch, shared by a weekday and by an exceptional date.
 *
 * A real button with role="switch" rather than the styled `<div onClick>` this
 * replaces: that one sat inside a <label> with no control to label, so it could
 * not be reached by keyboard and announced neither its purpose nor its state —
 * the only way to close a day was a mouse or a finger. The visual treatment is
 * unchanged.
 *
 * `label` names what is being switched (the day, or the date), because the word
 * beside the track only says which state it is in, and aria-checked already
 * carries that.
 */
function OpenClosedToggle({
  open,
  onToggle,
  label,
  labels,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  labels: { open: string; closed: string };
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      aria-label={label}
      onClick={onToggle}
      // py-2 rather than none: on a phone the track alone is a 20px target.
      className="flex items-center gap-2 flex-shrink-0 py-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
    >
      <span
        aria-hidden
        className={`relative w-9 h-5 rounded-full transition-colors ${open ? "bg-gray-900" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${open ? "translate-x-4" : ""}`} />
      </span>
      {/* Secondary, not disabled-looking: a closed day is a normal answer. */}
      <span className={`text-xs font-medium ${open ? "text-gray-900" : "text-gray-500"}`}>
        {open ? labels.open : labels.closed}
      </span>
    </button>
  );
}

function HighlightRowActions({
  index,
  total,
  onMove,
  onRemove,
  labels,
  className = "",
}: {
  index: number;
  total: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
  labels: { moveUp: string; moveDown: string; remove: string };
  className?: string;
}) {
  const base =
    "w-9 h-9 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-colors focus:outline-none focus:ring-2";
  const move =
    "border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-300 " +
    // Disabled has to read as unavailable, not as low-contrast-but-live.
    "disabled:text-gray-300 disabled:border-gray-100 disabled:bg-gray-50/60 disabled:cursor-not-allowed " +
    "disabled:hover:text-gray-300 disabled:hover:border-gray-100 disabled:hover:bg-gray-50/60";
  const remove =
    "border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 focus:ring-red-200";

  return (
    <div className={`flex items-center gap-1.5 flex-shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        title={labels.moveUp}
        aria-label={labels.moveUp}
        className={`${base} ${move}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        title={labels.moveDown}
        aria-label={labels.moveDown}
        className={`${base} ${move}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onRemove}
        title={labels.remove}
        aria-label={labels.remove}
        className={`${base} ${remove}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
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
  // Exceptional dates — holidays and one-offs that differ from the week above.
  // The stored value is normalised on the way in with the same function the API
  // uses, so the editor and the server agree on the shape without a second copy
  // of the rules living here.
  const [exceptionalHours, setExceptionalHours] = useState<ExceptionalRow[]>(() =>
    normalizeExceptionalHours(business?.exceptionalHours).map((e) => ({
      ...e,
      open:  e.open  ?? "",
      close: e.close ?? "",
    }))
  );

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
  // Legacy, no longer edited here. Held in state and submitted unchanged so a
  // save from this editor never clears what the previous version stored.
  const [serviceModes]   = useState<string[]>(business?.serviceModes ?? []);
  const [highlightCodes] = useState<string[]>(business?.highlightCodes ?? []);

  // ── Stage 1 profile control fields ──────────────────────────────────────────
  const [hiddenFields,    setHiddenFields]    = useState<string[]>(business?.hiddenFields ?? []);
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(business?.deliveryMethods ?? []);
  const [serviceArea,     setServiceArea]     = useState(business?.serviceArea ?? "");
  const [highlights,      setHighlights]      = useState<HighlightItem[]>(() =>
    normalizeHighlights(business?.highlights)
  );

  function toggleInList(list: string[], setter: (v: string[]) => void, value: string) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  // ── Visibility ──────────────────────────────────────────────────────────────
  // Public by default: a field is public unless its name is in hiddenFields, so
  // an untouched profile needs no migration and nothing disappears on its own.
  const visibilityLabels = {
    hide:      t("visibility.hide"),
    show:      t("visibility.show"),
    hideTitle: t("visibility.hideTitle"),
    showTitle: t("visibility.showTitle"),
  };

  const writingLabels = {
    done:  t("writing.done"),
    close: t("writing.close"),
    edit:  t("writing.edit"),
  };

  const openClosedLabels = {
    open:   t("openState.open"),
    closed: t("openState.closed"),
  };

  const highlightActionLabels = {
    moveUp:   t("highlights.moveUp"),
    moveDown: t("highlights.moveDown"),
    remove:   t("highlights.remove"),
  };

  const isHidden = (field: HideableField) => hiddenFields.includes(field);
  const toggleHidden = (field: HideableField) =>
    setHiddenFields((prev) =>
      // Only this field's entry is touched. Names belonging to sections not yet
      // built are carried through untouched rather than dropped on save.
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );

  // ── Exceptional dates ───────────────────────────────────────────────────────
  // A new row starts CLOSED: the usual reason to name a date is that the
  // business is shut that day. CUSTOM is one toggle away.
  const addException = () =>
    setExceptionalHours((prev) =>
      prev.length >= EXCEPTIONAL_HOURS_MAX_COUNT
        ? prev
        : [...prev, { date: "", mode: "CLOSED", open: "", close: "", label: null, holiday: null }]
    );

  const updateException = (index: number, patch: Partial<ExceptionalRow>) =>
    setExceptionalHours((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  // React state only. Nothing leaves the browser until Lagre endringer, the
  // same rule the gallery follows.
  const removeException = (index: number) =>
    setExceptionalHours((prev) => prev.filter((_, i) => i !== index));

  // ── Highlights ──────────────────────────────────────────────────────────────
  // Order is the display order, so every operation works on position.
  const addHighlight = () =>
    setHighlights((prev) =>
      prev.length >= HIGHLIGHT_MAX_COUNT ? prev : [...prev, { no: "", en: "" }]
    );

  const updateHighlight = (index: number, lang: "no" | "en", value: string) =>
    setHighlights((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [lang]: value } : h))
    );

  const removeHighlight = (index: number) =>
    setHighlights((prev) => prev.filter((_, i) => i !== index));

  const moveHighlight = (index: number, delta: number) =>
    setHighlights((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(false);
  const [logoUploading,   setLogoUploading]   = useState(false);
  const [coverUploading,  setCoverUploading]  = useState(false);
  const [imageUploading,  setImageUploading]  = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");
  const [activeSection,   setActiveSection]   = useState<string>("basics");
  // Media viewer: the run being browsed and where to open it, or null. The
  // gallery passes all of its images so the reader can move along them; the
  // logo and the cover pass only themselves, since neither belongs to the
  // gallery sequence and stepping from a logo into photos would be nonsense.
  const [preview, setPreview] = useState<
    { images: string[]; index: number; label: (i: number, total: number) => string } | null
  >(null);
  // Gallery drag-reorder. `dragIndex` is what is being carried, `dropIndex`
  // where it would land — only used to draw the indicator.
  const [dragIndex,       setDragIndex]       = useState<number | null>(null);
  const [dropIndex,       setDropIndex]       = useState<number | null>(null);
  // Reordering is a deliberate mode, not something the grid is permanently
  // dressed for. Twelve images with numbers and two arrows each is 36 small
  // controls competing with the pictures; the controls appear only while the
  // owner has said that is what they are doing. It is presentation only —
  // entering and leaving changes nothing, and order still persists on Save.
  const [reordering,      setReordering]      = useState(false);

  // The in-flight drag. A ref, not state: it changes on every pointermove and
  // nothing renders from it — dragIndex and dropIndex above carry what the grid
  // actually draws.
  const dragSession = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    from: number;
    to: number;
    active: boolean;
    holdTimer: number | null;
    captureEl: HTMLElement | null;
  } | null>(null);
  const dragPointerY    = useRef(0);   // latest pointer Y, read by the edge scroll
  const autoScrollFrame = useRef<number | null>(null);

  // The floating copy of the tile being carried. It renders once when the drag
  // starts and is then moved by writing a transform straight to the node —
  // re-rendering the whole gallery on every pointermove would be visible.
  const [dragOverlay, setDragOverlay] = useState<{
    src: string; width: number; height: number;
    offsetX: number; offsetY: number; x: number; y: number;
  } | null>(null);
  const dragOverlayRef    = useRef<HTMLDivElement>(null);
  const dragOverlayOffset = useRef<{ x: number; y: number } | null>(null);
  const activeIndex   = SECTIONS.findIndex((s) => s.id === activeSection);
  const isLastSection = activeIndex === SECTIONS.length - 1;

  // ── Media: files whose deletion is waiting for Save ─────────────────────────
  // Removing a picture used to delete it from storage on the spot while the
  // database still pointed at it, so anyone who removed an image and reloaded
  // without saving came back to a broken URL. Explicit Save is the source of
  // truth everywhere else in this editor, so removal now waits for it too: the
  // URL leaves the form immediately, and the file is deleted only once the save
  // that drops it has succeeded. Abandoning the edit therefore changes nothing.
  //
  // A ref rather than state — nothing renders from it, and it must survive a
  // re-render without causing one.
  const pendingDeletions = useRef<string[]>([]);
  const stageDeletion = (url: string) => {
    if (url) pendingDeletions.current.push(url);
  };

  const logoInputRef   = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const navRef         = useRef<HTMLElement>(null);

  // The editor root — used to bring a newly activated section into view.
  const rootRef = useRef<HTMLDivElement>(null);


  // The tab strip scrolls horizontally on narrow screens, so a section reached
  // via Neste / Forrige can sit outside the visible run. Nudge the strip just
  // far enough to reveal it. Only the strip is scrolled — never the page.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!nav || !active) return;

    // Centring is a narrow-layout behaviour, gated on the layout itself rather
    // than only on a runtime overflow reading. The overflow check alone was not
    // enough: this effect also runs on mount, and a row that momentarily
    // overflows — the webfont still swapping in, the sidebar column still
    // settling — passed the check and centred the active tab, which on a middle
    // section scrolls the strip right and cuts the first tab off ("…leggende
    // info"). Desktop fits all six, so it is never scrolled from here at all.
    // Matches the breakpoint the tab-strip CSS uses for the same reason.
    if (!window.matchMedia("(max-width: 1023.98px)").matches) {
      // Clears an offset inherited from a narrower layout (a resize, or a
      // rotation) once the row fits again, so the first tab is never left
      // parked out of view.
      if (nav.scrollLeft !== 0 && nav.scrollWidth - nav.clientWidth <= 1) {
        nav.scrollLeft = 0;
      }
      return;
    }

    // A sub-pixel difference is not an overflow worth scrolling for.
    if (nav.scrollWidth - nav.clientWidth <= 1) return;

    // Centre the active tab rather than nudging it just far enough to be
    // visible. Nudging left it flush against an edge with the next label cut
    // mid-word — "Beliggen…" — which read as broken rather than as scrollable.
    // Centred, the neighbours sit half-visible on both sides, which says the
    // row continues without needing an arrow or a fade to say it.
    //
    // Rectangles rather than offsetLeft: the tabs' offsetParent is not the
    // strip (it is not positioned), so offset maths would use the wrong
    // origin. A delta fed to scrollBy is origin-independent, and the browser
    // clamps it at both ends, so the first and last tabs simply rest against
    // their edge instead of leaving a gap.
    const strip = nav.getBoundingClientRect();
    const tab   = active.getBoundingClientRect();
    const delta = (tab.left + tab.width / 2) - (strip.left + strip.width / 2);

    if (Math.abs(delta) < 1) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollBy({ left: delta, behavior: reduceMotion ? "auto" : "smooth" });
  }, [activeSection]);

  // ── Reveal the newly activated section ──────────────────────────────────────
  // Section changes come only from the tabs, Previous and Save and continue —
  // never from scrolling. When one happens the reader may be part-way down the
  // section they were on, so bring the top of the editor back under the site
  // header, which leaves the tab strip exactly where it sticks and the section
  // content starting just below it.
  //
  // Deliberately unobtrusive: it does nothing when the editor is already at or
  // below the header, so someone near the top of the page is never yanked and
  // the page heading is never pushed out of view for no reason.
  useEffect(() => {
    const editor = rootRef.current;
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
      // The replaced logo goes only once the save that replaces it succeeds.
      stageDeletion(previousUrl);
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
      stageDeletion(previousUrl);
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

  /**
   * Move a gallery image one place earlier or later. Array order is the
   * display order — it is what the public profile reads — so reordering is a
   * swap and needs nothing beyond the existing `images` field.
   */
  const moveGalleryImage = useCallback((from: number, to: number) => {
    setImages((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  // ── Dragging a gallery tile ─────────────────────────────────────────────────
  // One interaction, told differently to each input device because the devices
  // genuinely differ. A mouse has no ambiguity: press and move, and it is a
  // drag. A finger does — the same movement on the same pixels is how the page
  // is scrolled — so a finger has to say it means this, by resting for a moment
  // before moving.
  //
  // An earlier version tried to settle that with touch-action: pan-y, letting
  // the browser rule that sideways meant drag and downwards meant scroll. It
  // kept scrolling intact but made a downward drag impossible to start, which
  // is exactly the movement a grid needs most. The hold does the same job
  // without constraining direction: nothing is claimed until the hold
  // completes, and once it does, every direction is available.

  const DRAG_THRESHOLD = 8;    // px of mouse movement before a press is a drag
  const HOLD_MS        = 240;  // finger held still before a tile is picked up
  const HOLD_TOLERANCE = 10;   // px of drift allowed during the hold
  const EDGE_ZONE      = 64;   // px from a viewport edge that scrolls
  const EDGE_SPEED     = 9;    // px per frame

  // Every one of these is wrapped so its identity survives a re-render. That is
  // not a style choice: addEventListener and removeEventListener match on the
  // function object, and a drag re-renders several times, so a handler declared
  // plainly in the body is added as one object and "removed" as a different one
  // that was never registered.
  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrame.current !== null) {
      cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = null;
    }
  }, []);

  // Runs only while a drag is live, so a tile can be carried past the top or
  // bottom of the screen — image 12 back to image 1 without letting go.
  const startAutoScroll = useCallback(() => {
    if (autoScrollFrame.current !== null) return;
    const step = () => {
      const y = dragPointerY.current;
      if (y < EDGE_ZONE)                           window.scrollBy(0, -EDGE_SPEED);
      else if (y > window.innerHeight - EDGE_ZONE) window.scrollBy(0,  EDGE_SPEED);
      autoScrollFrame.current = requestAnimationFrame(step);
    };
    autoScrollFrame.current = requestAnimationFrame(step);
  }, []);

  /**
   * The single way a drag ends. Every exit path goes through here — drop,
   * cancel, lost capture, leaving reorder mode, unmount — and it is safe to
   * call twice, because the first call nulls the session the rest reads.
   */
  const clearDragSession = useCallback(() => {
    const session = dragSession.current;
    dragSession.current = null;

    if (session?.holdTimer) window.clearTimeout(session.holdTimer);

    // Release the capture explicitly rather than relying on the implicit
    // release: the tile may have re-rendered or gone since it was taken.
    if (session?.captureEl && session.captureEl.hasPointerCapture?.(session.pointerId)) {
      try { session.captureEl.releasePointerCapture(session.pointerId); } catch { /* already gone */ }
    }

    stopAutoScroll();

    // The scroll blocker and the safety net come off together with everything
    // else. Leaving the blocker on is what froze the page: it refuses every
    // touchmove on the document, so nothing scrolls until the tab is reloaded.
    window.removeEventListener("touchmove", blockTouchScroll);
    window.removeEventListener("pointerup", endDragFromWindow);
    window.removeEventListener("pointercancel", cancelDragFromWindow);

    dragOverlayOffset.current = null;
    setDragIndex(null);
    setDropIndex(null);
    setDragOverlay(null);
  }, [stopAutoScroll]);

  /**
   * Finish a drag and apply it.
   *
   * Order matters: the source and destination are read off the session, the
   * whole drag is torn down, and only then is React asked to reorder. Committing
   * first would re-render the grid while the page was still in drag mode, with
   * the blocker installed and the capture held — which is the state the reader
   * was left stuck in.
   */
  const finishDrag = useCallback(() => {
    const session = dragSession.current;
    const from = session?.active ? session.from : null;
    const to   = session?.active ? session.to   : null;

    clearDragSession();

    if (from !== null && to !== null && from !== to) moveGalleryImage(from, to);
  }, [clearDragSession, moveGalleryImage]);

  // The listeners never change; only what they call does.
  dragEndCallbacks.end    = finishDrag;
  dragEndCallbacks.cancel = clearDragSession;

  const activateDrag = (target: HTMLElement, session: NonNullable<typeof dragSession.current>) => {
    const tile = target.getBoundingClientRect();

    session.active = true;
    if (session.holdTimer) { window.clearTimeout(session.holdTimer); session.holdTimer = null; }

    try {
      target.setPointerCapture(session.pointerId);
      session.captureEl = target;
    } catch { /* the pointer already ended */ }

    window.addEventListener("touchmove", blockTouchScroll, { passive: false });
    // Safety net: if the tile's own pointerup never arrives — the element
    // re-rendered away, the gesture ended off-element — the window still ends
    // the drag. Both are idempotent, so whichever fires first wins and the
    // other becomes a no-op.
    window.addEventListener("pointerup", endDragFromWindow);
    window.addEventListener("pointercancel", cancelDragFromWindow);

    // The floating copy is sized from the tile it came out of and keeps the
    // same grip point, so the picture stays under the same part of the finger
    // it was picked up by rather than jumping to be centred on it.
    setDragOverlay({
      src: images[session.from],
      width: tile.width,
      height: tile.height,
      offsetX: session.startX - tile.left,
      offsetY: session.startY - tile.top,
      x: session.startX,
      y: session.startY,
    });
    dragOverlayOffset.current = {
      x: session.startX - tile.left,
      y: session.startY - tile.top,
    };
    setDragIndex(session.from);
    setDropIndex(session.from);
    startAutoScroll();
  };

  const onTilePointerDown = (index: number) => (e: React.PointerEvent) => {
    // The remove control is a target in its own right; pressing it must delete,
    // not pick the tile up, and must never start the hold.
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;

    // A press with a session already open means the previous one never ended.
    clearDragSession();

    const session = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      from: index,
      to: index,
      active: false,
      holdTimer: null as number | null,
      captureEl: null as HTMLElement | null,
    };
    dragSession.current = session;
    dragPointerY.current = e.clientY;

    // A mouse waits for movement instead; a hold there would only feel slow.
    if (e.pointerType === "mouse") return;

    const target = e.currentTarget as HTMLElement;
    session.holdTimer = window.setTimeout(() => {
      // The gesture may have ended, been abandoned, or been replaced since the
      // timer was set; only the session that set it may activate.
      if (dragSession.current !== session || session.active) return;
      activateDrag(target, session);
    }, HOLD_MS);
  };

  const onTilePointerMove = (e: React.PointerEvent) => {
    const session = dragSession.current;
    if (!session || session.pointerId !== e.pointerId) return;

    dragPointerY.current = e.clientY;

    if (!session.active) {
      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      const travelled = Math.hypot(dx, dy);

      if (e.pointerType === "mouse") {
        if (travelled <= DRAG_THRESHOLD) return;
        activateDrag(e.currentTarget as HTMLElement, session);
      } else {
        // Moving before the hold completes means the reader wanted to scroll.
        // Drop the session entirely and leave the page to it — this is what
        // keeps the gallery scrollable under a finger. The timer goes with it,
        // so it cannot fire later and install a blocker for a gesture that has
        // already become a scroll.
        if (travelled > HOLD_TOLERANCE) clearDragSession();
        return;
      }
    }

    // Move the floating copy without re-rendering the grid for every frame.
    const overlay = dragOverlayRef.current;
    if (overlay) {
      overlay.style.transform =
        `translate3d(${e.clientX - (dragOverlayOffset.current?.x ?? 0)}px, ` +
        `${e.clientY - (dragOverlayOffset.current?.y ?? 0)}px, 0) scale(1.03)`;
    }

    // Which tile is under the pointer now. The overlay is pointer-events:none,
    // so it never hides the grid from this lookup. Kept on the session as well
    // as in state, so the commit never depends on a render having landed.
    const under = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-gallery-index]");
    const over = under ? Number(under.dataset.galleryIndex) : NaN;
    if (Number.isInteger(over)) {
      session.to = over;
      setDropIndex(over);
    }
  };

  const onTilePointerUp     = () => finishDrag();
  // The browser takes the gesture away on an interruption — a call, a system
  // gesture. Same teardown, no commit.
  const onTilePointerCancel = () => clearDragSession();
  // Defensive only. Capture is also released implicitly at the end of a normal
  // gesture, and by then the session is already gone and this is a no-op; it
  // matters when capture is lost unexpectedly mid-drag, which would otherwise
  // leave the blocker installed with no pointerup ever arriving.
  const onTileLostPointerCapture = () => clearDragSession();

  // Leaving reorder mode — Ferdig, or a successful save closing it — takes the
  // tile handlers off the grid. Anything still in flight has to be ended here,
  // or its blocker and safety listeners would outlive the mode that owned them.
  useEffect(() => {
    if (!reordering) clearDragSession();
  }, [reordering, clearDragSession]);

  // Nothing outlives the component: not a frame loop, not a hold timer, not the
  // listener that refuses page scrolling.
  useEffect(() => clearDragSession, [clearDragSession]);

  /** Drop a gallery image from the form; the file itself goes on Save. */
  function removeGalleryImage(url: string, idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    stageDeletion(url);
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
    const checks: {
      invalid: boolean;
      section: string;
      messageKey: string;
      /** Interpolation values for messages that name their own limit. */
      values?: Record<string, string | number>;
    }[] = [
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
      // 5. Opening hours — exceptional dates only. The weekly schedule is
      // unchanged and still has no blocking rule of its own.
      //
      // The server normaliser silently drops an entry it cannot store: no date,
      // a date already used, or custom hours without a usable pair. Dropping is
      // right for data arriving from anywhere else, but here it would delete a
      // row the owner had just filled in and say nothing, so the same three
      // rules are stated up front instead.
      {
        invalid: exceptionalHours.some((e) => e.date.trim() === ""),
        section: "hours",
        messageKey: "exceptionalDateRequired",
      },
      {
        invalid: (() => {
          const dates = exceptionalHours.map((e) => e.date.trim()).filter(Boolean);
          return new Set(dates).size !== dates.length;
        })(),
        section: "hours",
        messageKey: "exceptionalDateDuplicate",
      },
      {
        invalid: exceptionalHours.some((e) => e.mode === "CUSTOM" && (!e.open || !e.close)),
        section: "hours",
        messageKey: "exceptionalTimesRequired",
      },
      // 6. Services — length. The server used to cap both fields with a slice
      // and report success, so a pasted description came back published and cut
      // mid-word. Stated here so the owner is told before the save, while the
      // text they wrote is still in the field.
      //
      // `?? ""` because `services` is cast straight from the stored JSON and
      // never passes through `normalizeServiceItem`, so a row saved before
      // either field existed can arrive without it. The public profile guards
      // the same cast the same way.
      {
        invalid: services.some((s) => (s.name ?? "").trim().length > SERVICE_NAME_MAX),
        section: "services",
        messageKey: "serviceNameTooLong",
        values: { max: SERVICE_NAME_MAX },
      },
      {
        invalid: services.some(
          (s) => (s.description ?? "").trim().length > SERVICE_DESCRIPTION_MAX
        ),
        section: "services",
        messageKey: "serviceDescriptionTooLong",
        values: { max: SERVICE_DESCRIPTION_MAX },
      },
    ];

    const failed = checks.find((c) => c.invalid);
    if (failed) {
      setError(t(`errors.${failed.messageKey}` as any, failed.values));
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
        // Times are sent only for a CUSTOM date — the shape the stored value
        // uses, and what the server normaliser expects. A CLOSED date keeps its
        // times in React state so toggling back restores them, but never
        // stores them: a closed day has no opening hours.
        exceptionalHours: exceptionalHours.map((e) => ({
          date:    e.date.trim(),
          mode:    e.mode,
          open:    e.mode === "CUSTOM" ? e.open  || null : null,
          close:   e.mode === "CUSTOM" ? e.close || null : null,
          label:   e.label,
          holiday: e.holiday,
        })),
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
        // Legacy, submitted exactly as loaded — this editor no longer offers
        // them, and omitting them would read as "cleared" on the server.
        serviceModes,
        highlightCodes,
        // Stage 1 profile control fields. Blank highlight rows are left in:
        // the server normaliser drops them, which keeps one rule in one place.
        hiddenFields,
        deliveryMethods,
        serviceArea:        serviceArea || null,
        highlights,
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
        // can localise; fall back to the generic message otherwise. `values`
        // travels with the error for the messages that name their own limit —
        // without it those render a literal "{max}".
        const fieldMsg =
          Array.isArray(data.fields) && data.fields[0]?.message
            ? t(`errors.${data.fields[0].message}` as any, data.fields[0].values)
            : null;
        setError(categoryMsg ?? fieldMsg ?? data.error ?? t("errors.generic"));
        return false;
      }

      // The save has landed, so the files those removals referred to are now
      // genuinely unreferenced and can go. Fire-and-forget, exactly as before:
      // a failed cleanup leaves an orphaned file, which is harmless, whereas
      // blocking on it would make Save feel slow for no benefit.
      const orphans = pendingDeletions.current;
      pendingDeletions.current = [];
      orphans.forEach((url) => { void deleteStorageFile(url); });

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

  // Saving saves; it does not navigate. Moving to another section after a
  // successful save meant that finishing a thought in Media dropped the editor
  // into Beliggenhet og kontakt, so the only way to save twice in a row was to
  // navigate back each time. The two are separate actions now — Forrige and
  // Neste move, Lagre saves and stays put.
  //
  // The one section change a save can still cause is the existing validation
  // jump inside doSave(), which reveals the field that blocked it.
  async function handlePrimary(e: React.FormEvent) {
    e.preventDefault();
    const ok = await doSave();
    // Saving is the end of a gallery management session, so the controls that
    // belong to it go away — the arrangement has been committed and there is
    // nothing left pending. A failed save deliberately leaves the mode open:
    // the work is still unsaved, and closing it would hide the controls the
    // owner needs to see what they were doing.
    //
    // The section is untouched either way. Save saves; it does not navigate.
    if (ok) setReordering(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} className={styles.editor}>
      {/* ── Thin, text-led section navigation — switches the active section.
             Horizontally scrollable on mobile, same model on desktop.

             It sticks directly under the site header at every width, so a
             long section never hides which section is being edited. Opaque
             background (matching the workspace surface) so fields do not read
             through it, and it sits under the header's z-50 but over content.
             On desktop it spans the centred editor frame only, leaving the
             sidebar's own sticky column alone. ── */}
      {/* ── Editor actions ─────────────────────────────────────────────────
          At the top, with the heading and the tabs, rather than at the foot of
          the section. Media runs several screens long, and putting Save at the
          bottom meant scrolling past every field to reach it — then scrolling
          back to carry on working. These belong to the profile as a whole, not
          to whichever section happens to be open.

          Not sticky: mobile already spends viewport on the site header, the
          section strip and the fixed workspace navigation, and a fourth fixed
          layer would leave very little to edit in. ── */}
      <div className="flex items-center justify-end gap-2.5 mb-4">
        {isEdit && business.status === "APPROVED" && (
          <a
            href={`/${locale}/business/${business.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            {t("actions.preview")}
          </a>
        )}

        {/* `form` rather than nesting: the button sits above the form element,
            and this keeps it a real submit, so the existing onSubmit path,
            validation and Enter-to-submit all behave exactly as before. */}
        <button
          type="submit"
          form={FORM_ID}
          disabled={loading}
          className="btn btn-primary btn-sm min-w-[132px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner small /> {t("savingState")}
            </span>
          ) : (
            isEdit ? t("actions.save") : t("actions.create")
          )}
        </button>
      </div>

      <nav
        ref={navRef}
        // overscroll-x-contain keeps a horizontal flick on the tabs from
        // chaining into the page or a browser back-swipe. Proximity snapping,
        // not mandatory: it settles a tab into place when a flick ends near
        // one and otherwise stays out of the way of ordinary scrolling.
        className={`sticky top-[var(--app-header-height)] z-30 bg-gray-50 flex items-center gap-5 sm:gap-6 lg:gap-7 border-b border-gray-200 overflow-x-auto overscroll-x-contain scrollbar-hide mb-8 ${styles.tabStrip}`}
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            aria-current={activeSection === s.id ? "true" : undefined}
            className={`whitespace-nowrap py-3 -mb-px border-b-2 text-sm transition-colors ${styles.tab} ${
              activeSection === s.id
                ? "border-gray-900 text-gray-900 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t(`tabs.${s.labelKey}`)}
          </button>
        ))}
        {/* Trailing spacer. When the strip overflows, the last tab otherwise
            ends flush against the right edge with nothing after it, which
            reads as clipped rather than scrollable. padding-right on the
            scroll container is not equivalent — several browsers ignore it at
            the scroll end, so the space has to be a real flex child. It is
            aria-hidden and carries no tab semantics, so the active-tab lookup
            above is unaffected. */}
        <span aria-hidden className="flex-shrink-0 w-2 sm:w-3" />
      </nav>

      {/* ── Form body — one section rendered at a time ─────────────────── */}
      {/* `noValidate`: hidden sections make native constraint validation
          unreliable — see the Field validation note at the top of this file.
          doSave() owns every blocking rule instead. */}
      <form id={FORM_ID} onSubmit={handlePrimary} noValidate className="min-w-0">
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
                <Select
                  value={topLevelId}
                  onChange={(id) => {
                    setTopLevelId(id);
                    // Clear an incompatible Subcategory when the parent changes.
                    const current = allSubcategories.find((c) => c.id === categoryId);
                    if (!current || current.parentId !== id) setCategoryId("");
                  }}
                  ariaLabel={t("labels.category")}
                  placeholder={t("placeholders.selectCategory")}
                  options={[
                    { value: "", label: t("placeholders.selectCategory") },
                    ...topLevelCategories.map((c) => ({
                      value: c.id,
                      label: c.slug && tCat.has(c.slug) ? tCat(c.slug) : c.name,
                    })),
                  ]}
                />
              </div>

              <div>
                <FieldLabel>{t("labels.subcategory")}</FieldLabel>
                <Select
                  value={categoryId}
                  onChange={setCategoryId}
                  disabled={!topLevelId}
                  ariaLabel={t("labels.subcategory")}
                  placeholder={topLevelId ? t("placeholders.selectSubcategory") : t("placeholders.selectTopLevelFirst")}
                  options={[
                    {
                      value: "",
                      label: topLevelId ? t("placeholders.selectSubcategory") : t("placeholders.selectTopLevelFirst"),
                    },
                    ...allSubcategories
                      .filter((c) => c.parentId === topLevelId)
                      .sort((a, b) => subOrder(a.slug ?? "") - subOrder(b.slug ?? ""))
                      .map((c) => ({
                        value: c.id,
                        label: c.slug && tCat.has(c.slug) ? tCat(c.slug) : c.name,
                      })),
                  ]}
                />
              </div>
            </div>

            {/* Short business description (NO / EN) — shown directly below the
                business name on the public profile. The explanation sits above
                the pair rather than under each field: it describes the pair,
                and repeating it twice was the noisiest thing on this screen.
                What stays under each field is what differs — its own count. */}
            <div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                {t("hints.identitySummary")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>{t("labels.identitySummaryNo")}</FieldLabel>
                  <FocusedTextarea
                    value={identitySummaryNo}
                    onChange={setIdentitySummaryNo}
                    label={t("labels.identitySummaryNo")}
                    hint={t("hints.identitySummary")}
                    placeholder={t("placeholders.identitySummaryNo")}
                    maxLength={IDENTITY_SUMMARY_MAX}
                    counter={`${identitySummaryNo.trim().length}/${IDENTITY_SUMMARY_MAX}`}
                    previewHeight={96}
                    labels={writingLabels}
                  />
                  <p className="text-xs text-gray-400 mt-1 tabular-nums">
                    {identitySummaryNo.trim().length}/{IDENTITY_SUMMARY_MAX}
                  </p>
                </div>
                <div>
                  <FieldLabel>{t("labels.identitySummaryEn")}</FieldLabel>
                  <FocusedTextarea
                    value={identitySummaryEn}
                    onChange={setIdentitySummaryEn}
                    label={t("labels.identitySummaryEn")}
                    hint={t("hints.identitySummary")}
                    placeholder={t("placeholders.identitySummaryEn")}
                    maxLength={IDENTITY_SUMMARY_MAX}
                    counter={`${identitySummaryEn.trim().length}/${IDENTITY_SUMMARY_MAX}`}
                    previewHeight={96}
                    labels={writingLabels}
                  />
                  <p className="text-xs text-gray-400 mt-1 tabular-nums">
                    {identitySummaryEn.trim().length}/{IDENTITY_SUMMARY_MAX}
                  </p>
                </div>
              </div>
            </div>

            {/* Full description — the broader text, and deliberately separated
                from the short summary by a rule so the two are not read as
                longer and shorter versions of the same thing. */}
            <div className="pt-6 border-t border-gray-100">
              <FieldLabel>{t("labels.description")}</FieldLabel>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                {t("hints.description")}
              </p>
              <FocusedTextarea
                value={description}
                onChange={setDescription}
                label={t("labels.description")}
                hint={t("hints.description")}
                placeholder={t("placeholders.description")}
                counter={`${description.length} / 1000`}
                previewHeight={152}
                labels={writingLabels}
              />
              <p className="text-xs text-gray-400 mt-1 tabular-nums">{description.length} / 1000</p>
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
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">{t("hints.companyStory")}</p>
              <FocusedTextarea
                value={companyStory}
                onChange={setCompanyStory}
                label={t("labels.companyStory")}
                hint={t("hints.companyStory")}
                placeholder={t("placeholders.companyStory")}
                previewHeight={152}
                labels={writingLabels}
              />
            </div>

            {/* Founded year + employee count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <LabelRow
                  label={t("labels.foundedYear")}
                  hidden={isHidden("foundedYear")}
                  onToggle={() => toggleHidden("foundedYear")}
                  labels={visibilityLabels}
                />
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
                {isHidden("foundedYear") && <HiddenNote>{t("visibility.hiddenNote")}</HiddenNote>}
              </div>
              <div>
                <LabelRow
                  label={t("labels.employeeCount")}
                  hidden={isHidden("employeeCount")}
                  onToggle={() => toggleHidden("employeeCount")}
                  labels={visibilityLabels}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.employeeCount")}
                />
                {isHidden("employeeCount") && <HiddenNote>{t("visibility.hiddenNote")}</HiddenNote>}
              </div>
            </div>

            {/* Company size — the stored values are unchanged; only the labels
                lost their employee ranges, which contradicted the separate
                employee-count field above whenever the two disagreed. */}
            <div>
              <LabelRow
                label={t("labels.companySize")}
                hidden={isHidden("companySize")}
                onToggle={() => toggleHidden("companySize")}
                labels={visibilityLabels}
              />
              <Select
                value={companySize}
                onChange={setCompanySize}
                ariaLabel={t("labels.companySize")}
                placeholder={t("companySize.none")}
                className="sm:max-w-xs"
                options={[
                  { value: "", label: t("companySize.none") },
                  ...COMPANY_SIZES.map((size) => ({
                    value: size,
                    label: t(`companySize.${size}` as any),
                  })),
                ]}
              />
              {isHidden("companySize") && <HiddenNote>{t("visibility.hiddenNote")}</HiddenNote>}
            </div>

            {/* Legal name + organization number + organization type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <LabelRow
                  label={t("labels.legalName")}
                  hidden={isHidden("legalName")}
                  onToggle={() => toggleHidden("legalName")}
                  labels={visibilityLabels}
                />
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.legalName")}
                />
                {isHidden("legalName") && <HiddenNote>{t("visibility.hiddenNote")}</HiddenNote>}
              </div>
              <div>
                <LabelRow
                  label={t("labels.organizationNumber")}
                  hidden={isHidden("organizationNumber")}
                  onToggle={() => toggleHidden("organizationNumber")}
                  labels={visibilityLabels}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={organizationNumber}
                  onChange={(e) => setOrganizationNumber(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.organizationNumber")}
                />
                <p className="text-xs text-gray-500 mt-1">{t("hints.organizationNumber")}</p>
                {isHidden("organizationNumber") && <HiddenNote>{t("visibility.hiddenNote")}</HiddenNote>}
              </div>
            </div>

            <div>
              <LabelRow
                label={t("labels.organizationType")}
                hidden={isHidden("organizationType")}
                onToggle={() => toggleHidden("organizationType")}
                labels={visibilityLabels}
              />
              <input
                type="text"
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value)}
                className="input"
                placeholder={t("placeholders.organizationType")}
              />
              {isHidden("organizationType") && <HiddenNote>{t("visibility.hiddenNote")}</HiddenNote>}
            </div>

            {/* Delivery methods — how the service reaches the customer. The
                list this replaces mixed that with how far the business
                travels, which is now the separate field below. */}
            <fieldset className="pt-6 border-t border-gray-100">
              <legend className="block text-sm font-semibold text-gray-800 mb-1.5">
                {t("labels.deliveryMethods")}
              </legend>
              <p className="text-xs text-gray-500 mb-2.5 leading-relaxed">{t("hints.deliveryMethods")}</p>
              {/* Two columns from sm, one below it. Wrapping five items on a
                  single line put two of them alone on the second row, which
                  read as a separate group; a column keeps them one list. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:max-w-lg">
                {DELIVERY_METHODS.map((method) => (
                  <CheckOption
                    key={method}
                    checked={deliveryMethods.includes(method)}
                    onChange={() => toggleInList(deliveryMethods, setDeliveryMethods, method)}
                    label={t(`deliveryMethod.${method}` as any)}
                  />
                ))}
              </div>
            </fieldset>

            {/* Service area — single choice: the three values are nested, so
                selecting more than one would state nothing extra. */}
            <div>
              <FieldLabel>{t("labels.serviceArea")}</FieldLabel>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">{t("hints.serviceArea")}</p>
              <Select
                value={serviceArea}
                onChange={setServiceArea}
                ariaLabel={t("labels.serviceArea")}
                placeholder={t("serviceAreaOption.none")}
                className="sm:max-w-xs"
                options={[
                  { value: "", label: t("serviceAreaOption.none") },
                  ...SERVICE_AREAS.map((area) => ({
                    value: area,
                    label: t(`serviceAreaOption.${area}` as any),
                  })),
                ]}
              />
            </div>

            {/* Highlights — written by the business, in both languages, in the
                order it arranges. The fixed code list this replaces could not
                serve a restaurant and a plumber with the same ten options. */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="block text-sm font-semibold text-gray-800">{t("labels.highlights")}</span>
                {highlights.length > 0 && (
                  <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                    {t("highlights.count", { count: highlights.length, max: HIGHLIGHT_MAX_COUNT })}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{t("hints.highlights")}</p>

              {highlights.length === 0 && (
                <p className="text-sm text-gray-400 py-1">{t("highlights.empty")}</p>
              )}

              {highlights.length > 0 && (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {highlights.map((h, idx) => (
                    <div key={idx} className="py-4">
                      {/* Below sm the index and the actions take their own line
                          above the inputs. Three buttons and two text fields
                          cannot share a row at 375px without every one of them
                          becoming too small to hit. */}
                      <div className="flex items-center justify-between gap-3 mb-2 sm:hidden">
                        <span className="text-xs font-semibold text-gray-400 tabular-nums">
                          {idx + 1}
                        </span>
                        <HighlightRowActions
                          index={idx}
                          total={highlights.length}
                          onMove={(d) => moveHighlight(idx, d)}
                          onRemove={() => removeHighlight(idx)}
                          labels={highlightActionLabels}
                        />
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="hidden sm:block w-5 flex-shrink-0 pt-7 text-xs font-semibold text-gray-400 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {t("highlights.norwegian")}
                            </label>
                            <input
                              type="text"
                              value={h.no ?? ""}
                              onChange={(e) => updateHighlight(idx, "no", e.target.value)}
                              maxLength={HIGHLIGHT_MAX_LENGTH}
                              className="input"
                              placeholder={t("highlights.placeholderNo")}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {t("highlights.english")}
                            </label>
                            <input
                              type="text"
                              value={h.en ?? ""}
                              onChange={(e) => updateHighlight(idx, "en", e.target.value)}
                              maxLength={HIGHLIGHT_MAX_LENGTH}
                              className="input"
                              placeholder={t("highlights.placeholderEn")}
                            />
                          </div>
                        </div>
                        {/* Buttons rather than drag: they work by keyboard and
                            on a touch screen without a drag surface, and the
                            list is short enough that a swap is one press. */}
                        <HighlightRowActions
                          index={idx}
                          total={highlights.length}
                          onMove={(d) => moveHighlight(idx, d)}
                          onRemove={() => removeHighlight(idx)}
                          labels={highlightActionLabels}
                          className="hidden sm:flex pt-6"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* The legacy selections are not converted into text here: their
                  wording lives in the message catalogues, so writing it into
                  the record would fix one language into the data. They keep
                  showing publicly until the business writes its own. */}
              {highlights.length === 0 && highlightCodes.length > 0 && (
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  {t("highlights.legacyNote", { count: highlightCodes.length })}
                </p>
              )}

              <button
                type="button"
                onClick={addHighlight}
                disabled={highlights.length >= HIGHLIGHT_MAX_COUNT}
                className="inline-flex items-center gap-2 mt-4 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t("highlights.add")}
              </button>
            </div>
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
                    // The picture opens the picture. Replacing it is the
                    // separate "Endre logo" button beside it — clicking an
                    // image to be shown a file dialog is the one thing this
                    // section previously got wrong.
                    <button
                      type="button"
                      onClick={() => setPreview({ images: [logo], index: 0, label: () => t("labels.logo") })}
                      aria-label={`${t("labels.logo")} — ${t("media.preview")}`}
                      className="w-full h-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <Image src={logo} alt="Logo" width={80} height={80} className="w-full h-full object-cover" />
                    </button>
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
                      onClick={() => { stageDeletion(logo); setLogo(""); }}
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
                    <button
                      type="button"
                      onClick={() => setPreview({ images: [coverImage], index: 0, label: () => t("labels.cover") })}
                      aria-label={`${t("labels.cover")} — ${t("media.preview")}`}
                      className="w-full h-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <Image src={coverImage} alt="Cover" width={800} height={200} className="w-full h-full object-cover" />
                    </button>
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
                      onClick={() => { stageDeletion(coverImage); setCoverImage(""); }}
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
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="block text-sm font-semibold text-gray-800">{t("photoGallery")}</span>
                {/* Count only. There is no maximum anywhere in the product —
                    no cap in the editor, the API, or the schema — so showing
                    "x / y" would invent a limit that does not exist. */}
                {images.length > 0 && (
                  <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                    {t("media.count", { count: images.length })}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">{t("hints.photos")}</p>
              <input
                ref={imagesInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImagesChange}
              />
              <div className="flex flex-wrap items-center gap-2.5">
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

                {/* Only worth offering once there is something to reorder.
                    Entering and leaving this mode saves nothing. */}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => { setReordering((r) => !r); setDragIndex(null); setDropIndex(null); }}
                    aria-pressed={reordering}
                    className="btn btn-secondary btn-sm"
                  >
                    {reordering ? t("media.reorderDone") : t("media.reorder")}
                  </button>
                )}
              </div>
              {images.length > 0 && (
                <>
                  {/* Guidance belongs to the mode that needs it, not to the
                      grid at rest. */}
                  {reordering && (
                    <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                      {t("media.reorderHint")}
                    </p>
                  )}

                  <ul className={`grid grid-cols-3 sm:grid-cols-4 gap-3 ${reordering ? "mt-2.5" : "mt-4"}`}>
                    {images.map((img, idx) => (
                      <li
                        key={img}
                        // The drag reads positions off the DOM by coordinate,
                        // so each tile has to say which index it is.
                        data-gallery-index={idx}
                        onPointerDown={reordering ? onTilePointerDown(idx) : undefined}
                        onPointerMove={reordering ? onTilePointerMove : undefined}
                        onPointerUp={reordering ? onTilePointerUp : undefined}
                        onPointerCancel={reordering ? onTilePointerCancel : undefined}
                        onLostPointerCapture={reordering ? onTileLostPointerCapture : undefined}
                        // The whole picture is the drag surface while
                        // reordering; outside the mode the tile carries no
                        // pointer handling at all.
                        className={reordering ? styles.reorderTile : undefined}
                      >
                        <div
                          className={`relative aspect-square rounded-xl overflow-hidden border transition-all duration-150 ${
                            // Where the picture came from: still legible, still
                            // clearly a hole in the run, and not a blank gap.
                            dragIndex === idx
                              ? "border-dashed border-gray-300 bg-gray-50 opacity-30"
                              // Where it will land, said plainly enough to read
                              // before letting go.
                              : dropIndex === idx && dragIndex !== null
                                ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2 ring-offset-gray-50 scale-[0.97]"
                                : "border-gray-200"
                          } ${
                            reordering
                              ? dragIndex !== null
                                ? "cursor-grabbing select-none"
                                : "cursor-grab select-none"
                              : ""
                          }`}
                        >
                          {/* A real button, so the picture is reachable by Tab
                              and opens on Enter or Space like anything else. */}
                          <button
                            type="button"
                            // The whole gallery, opened at this picture — and
                            // read from current state, so an unsaved reorder
                            // or removal is what gets browsed.
                            onClick={() => setPreview({
                              images,
                              index: idx,
                              label: (i, total) => t("media.position", { index: i + 1, total }),
                            })}
                            aria-label={`${t("media.position", { index: idx + 1, total: images.length })} — ${t("media.preview")}`}
                            // While managing, the tile carries the position,
                            // the remove control and the drag handle; opening a
                            // full-screen viewer from the same tap would fight
                            // all three.
                            disabled={reordering}
                            // pointer-events-none as well as disabled: the
                            // button covers the whole tile, and a disabled
                            // control still absorbs the press in some browsers,
                            // which would leave the drag with nothing to start
                            // from. The viewer stays unreachable in this mode.
                            className={`absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 ${
                              reordering ? "pointer-events-none" : "cursor-zoom-in"
                            }`}
                          >
                            <Image
                              src={img}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 33vw, 25vw"
                              className="object-cover pointer-events-none"
                            />
                          </button>

                          {/* Position numbers earn their place only while the
                              order is being changed. */}
                          {reordering && (
                            <span
                              aria-hidden
                              className="absolute top-1.5 left-1.5 min-w-[18px] h-[18px] px-1 rounded-md bg-gray-900/70 text-white text-[10px] font-semibold tabular-nums flex items-center justify-center pointer-events-none"
                            >
                              {idx + 1}
                            </span>
                          )}

                          {/* Removal lives with the other management controls,
                              not on the resting grid: a delete button on every
                              photo made simply looking at the Media section
                              feel like operating an admin tool. Neutral until
                              pointed at, so even in this mode the grid does not
                              read as a row of delete buttons. */}
                          {reordering && (
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(img, idx)}
                              data-no-drag
                              title={t("media.removeImage")}
                              aria-label={`${t("media.position", { index: idx + 1, total: images.length })} — ${t("media.removeImage")}`}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-gray-900/50 text-white backdrop-blur-[2px] hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-white/70 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                      </li>
                    ))}
                  </ul>

                  {/* Says what removal actually does. Only relevant while a
                      remove control is on screen. */}
                  {reordering && (
                    <p className="text-xs text-gray-400 mt-3">{t("media.pendingRemoval")}</p>
                  )}
                </>
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

            {/* Postnummer before Poststed — the order a Norwegian address is
                written and read, and the order the public profile already
                prints it in ("0154 Oslo"). Below sm the two stack, postcode
                first, which is the same reading order.

                `labels.city` reads "Poststed" in Norwegian and "City" in
                English. It is a display label only: the value is still the
                `city` state and the `city` column, which search, the business
                cards, the SEO title and the locations page all read. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div>
              <FieldLabel>{t("labels.mapsUrl")}</FieldLabel>
              {/* Helper above the control, as in every other section of this
                  editor — it says what to paste before the empty field asks
                  for it, rather than after. */}
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">{t("hints.mapsUrl")}</p>
              <input
                type="url"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                className="input"
                placeholder="https://maps.google.com/..."
              />
            </div>

            {/* Coordinates, behind a disclosure. "Avanserte kartinnstillinger"
                rather than "GPS-koordinater": most owners never need this, and
                the ones who do are looking for the advanced setting, not the
                acronym. The fields, their state and their validation are
                unchanged — see the latitude note below. py-2 gives the summary
                a row-height tap target on a phone; it is a full-width flex row,
                so anywhere along it toggles. */}
            <details className="group">
              <summary className="text-sm text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors flex items-center gap-1.5 py-2">
                <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {t("labels.gpsCoordinates")}
              </summary>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{t("hints.coordinates")}</p>
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
                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{t("hints.bookingUrl")}</p>
                <input
                  type="url"
                  value={bookingLink}
                  onChange={(e) => setBookingLink(e.target.value)}
                  className="input"
                  placeholder={t("placeholders.bookingUrl")}
                />
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
                  // sm:min-h keeps a closed row the same height as an open one
                  // on the single-line desktop layout, where the open row is as
                  // tall as its 44px time fields. A closed day should read as a
                  // normal answer in the same list, not as a shrunken row.
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 sm:min-h-[68px]"
                >
                  {/* Day and state share the first line on narrow screens so a
                      day costs two lines rather than three. `sm:contents`
                      dissolves this wrapper at sm+, restoring the approved
                      flat desktop row exactly. */}
                  <div className="flex items-center justify-between gap-3 sm:contents">
                    {/* Day name — the same weight and colour whether the day is
                        open or closed. Muting it made an ordinary closed day
                        look like a row that had been switched off. */}
                    <span className="sm:w-28 text-sm font-medium flex-shrink-0 text-gray-800">
                      {t(`days.${day}`)}
                    </span>

                    <OpenClosedToggle
                      open={!h.closed}
                      onToggle={() => updateHours(day, "closed", !h.closed)}
                      label={t(`days.${day}`)}
                      labels={openClosedLabels}
                    />
                  </div>

                  {/* Times only when the day is open. A closed day shows no
                      time controls at all rather than two disabled-looking
                      empty fields. The values stay in state, so switching the
                      day back on restores exactly what was there. */}
                  {!h.closed && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => updateHours(day, "open", e.target.value)}
                        aria-label={`${t(`days.${day}`)} ${t("labels.opensAt")}`}
                        className="input py-1.5 px-3 text-sm flex-1 min-w-0"
                      />
                      <span aria-hidden className="text-gray-400 text-sm font-medium">–</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => updateHours(day, "close", e.target.value)}
                        aria-label={`${t(`days.${day}`)} ${t("labels.closesAt")}`}
                        className="input py-1.5 px-3 text-sm flex-1 min-w-0"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Spesielle åpningstider ───────────────────────────────────
              Secondary to the week above and quiet until asked for: the same
              disclosure language as Avanserte kartinnstillinger, so the page
              stays a weekly schedule rather than becoming a calendar product.
              Collapsed by default. ── */}
          <div className="pt-6 border-t border-gray-100">
            <details className="group">
              <summary className="text-sm text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors flex items-center gap-1.5 py-2">
                <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {t("labels.exceptionalHours")}
              </summary>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{t("hints.exceptionalHours")}</p>

              {exceptionalHours.length === 0 && (
                <p className="text-sm text-gray-400 mt-3">{t("exceptional.empty")}</p>
              )}

              {exceptionalHours.length > 0 && (
                <div className="divide-y divide-gray-100 border-t border-gray-100 mt-3">
                  {exceptionalHours.map((ex, idx) => {
                    // CLOSED is the only mode that hides the times. SAME — a
                    // date stored by something other than this editor, meaning
                    // "follows the normal week" — reads as open here, and
                    // becomes CUSTOM the moment a time is entered, which is
                    // the only shape the server keeps times for.
                    const exOpen = ex.mode !== "CLOSED";
                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 sm:min-h-[68px]"
                      >
                        {/* Date and remove share the first line on a phone, the
                            way the day and its switch do above. `sm:contents`
                            dissolves the wrapper at sm+, and `sm:order-last`
                            then sends remove to the end of the flat row, so
                            desktop reads Dato · Åpent/Stengt · Fra · Til · Fjern. */}
                        <div className="flex items-center justify-between gap-3 sm:contents">
                          <input
                            type="date"
                            value={ex.date}
                            onChange={(e) => updateException(idx, { date: e.target.value })}
                            aria-label={t("labels.exceptionalDate")}
                            className="input py-1.5 px-3 text-sm sm:w-44 flex-shrink-0"
                          />
                          <button
                            type="button"
                            onClick={() => removeException(idx)}
                            title={t("actions.removeExceptionalDate")}
                            aria-label={t("actions.removeExceptionalDate")}
                            className="w-9 h-9 sm:w-8 sm:h-8 sm:order-last flex-shrink-0 rounded-lg border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <OpenClosedToggle
                          open={exOpen}
                          onToggle={() => updateException(idx, { mode: exOpen ? "CLOSED" : "CUSTOM" })}
                          label={ex.date || t("labels.exceptionalDate")}
                          labels={openClosedLabels}
                        />

                        {exOpen && (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              type="time"
                              value={ex.open}
                              onChange={(e) => updateException(idx, { mode: "CUSTOM", open: e.target.value })}
                              aria-label={t("labels.opensAt")}
                              className="input py-1.5 px-3 text-sm flex-1 min-w-0"
                            />
                            <span aria-hidden className="text-gray-400 text-sm font-medium">–</span>
                            <input
                              type="time"
                              value={ex.close}
                              onChange={(e) => updateException(idx, { mode: "CUSTOM", close: e.target.value })}
                              aria-label={t("labels.closesAt")}
                              className="input py-1.5 px-3 text-sm flex-1 min-w-0"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={addException}
                disabled={exceptionalHours.length >= EXCEPTIONAL_HOURS_MAX_COUNT}
                className="inline-flex items-center gap-2 mt-4 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t("actions.addExceptionalDate")}
              </button>
            </details>
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
                        {/* No `maxLength`: the browser would trim a paste down
                            to the limit without saying so, which is the same
                            silent loss the save used to cause. The count is
                            allowed to go over and turns red, and the save
                            blocks with the limit named, so the owner's full
                            text stays in the field until they shorten it. */}
                        <input
                          type="text"
                          value={svc.description}
                          onChange={(e) => updateService(svc.id, "description", e.target.value)}
                          className="input"
                          placeholder={t("placeholders.serviceDescription")}
                        />
                        <p
                          className={`text-xs mt-1 tabular-nums ${
                            (svc.description ?? "").trim().length > SERVICE_DESCRIPTION_MAX
                              ? "text-red-600 font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {(svc.description ?? "").trim().length}/{SERVICE_DESCRIPTION_MAX}
                        </p>
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

        {/* ── Section navigation ─────────────────────────────────────────
             Movement only. Preview and Save live in the header now, so this
             row carries no second copy of either. ── */}
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
          {!isLastSection && (
            <button
              type="button"
              onClick={() => setActiveSection(SECTIONS[activeIndex + 1].id)}
              className="btn btn-secondary ml-auto"
            >
              {t("actions.next")}
            </button>
          )}
        </div>
      </form>

      {/* One viewer for the whole section — logo, cover and every gallery
          image open the same thing. */}
      {/* The picture being carried. Portalled to <body> so the gallery's own
          rounded, overflow-hidden tiles cannot clip it, and pointer-events:none
          so it never hides the grid from the drop-target lookup underneath. */}
      {dragOverlay && typeof document !== "undefined" && createPortal(
        <div
          ref={dragOverlayRef}
          aria-hidden
          className="fixed top-0 left-0 z-[80] pointer-events-none rounded-xl overflow-hidden shadow-[0_12px_32px_rgba(17,24,39,0.28)] ring-1 ring-black/5"
          style={{
            width: dragOverlay.width,
            height: dragOverlay.height,
            transform: `translate3d(${dragOverlay.x - dragOverlay.offsetX}px, ${dragOverlay.y - dragOverlay.offsetY}px, 0) scale(1.03)`,
          }}
        >
          <Image
            src={dragOverlay.src}
            alt=""
            fill
            sizes="200px"
            className="object-cover"
          />
        </div>,
        document.body
      )}

      {preview && (
        <ImageLightbox
          images={preview.images}
          startIndex={preview.index}
          label={preview.label}
          labels={{
            close:    t("media.close"),
            previous: t("media.previousImage"),
            next:     t("media.nextImage"),
          }}
          onClose={() => setPreview(null)}
        />
      )}
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
