"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
}

interface Category {
  id: string;
  name: string;
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

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

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
  { id: "basics",   label: "Basic info" },
  { id: "media",    label: "Media" },
  { id: "location", label: "Location" },
  { id: "contact",  label: "Contact" },
  { id: "hours",    label: "Opening hours" },
  { id: "services", label: "Services" },
] as const;

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
    <div id={id} className="scroll-mt-24 pb-3 border-b border-gray-100 mb-6">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
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
  const isEdit  = !!business;

  // Stable UUID for new businesses — used as the storage folder path before
  // the first save. crypto.randomUUID() is unpredictable (unlike useId which
  // generates short sequential strings like "r0", "r1").
  const [tempId]   = useState(() => crypto.randomUUID().replace(/-/g, ""));
  const businessId = business?.id ?? tempId;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name,         setName]        = useState(business?.name         ?? "");
  const [description,  setDescription] = useState(business?.description  ?? "");
  const [categoryId,   setCategoryId]  = useState(business?.categoryId   ?? "");
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

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(false);
  const [logoUploading,   setLogoUploading]   = useState(false);
  const [coverUploading,  setCoverUploading]  = useState(false);
  const [imageUploading,  setImageUploading]  = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");
  const [activeSection,   setActiveSection]   = useState("basics");

  const logoInputRef   = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

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
      { id: crypto.randomUUID(), name: "", description: "", price: "" },
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
      setError(err instanceof Error ? err.message : "Logo upload failed");
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
      setError(err instanceof Error ? err.message : "Cover upload failed");
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
      setError(err instanceof Error ? err.message : "Image upload failed");
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
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Business name is required.");
      document.getElementById("basics")?.scrollIntoView({ behavior: "smooth" });
      return;
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
      };

      const res  = await fetch("/api/business", {
        method:  isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccess(
          isEdit
            ? "Profile updated successfully."
            : "Profile created! It will go live once an admin approves it."
        );
        router.refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Sticky section nav ─────────────────────────────────────────── */}
      <nav className="hidden lg:block w-44 flex-shrink-0">
        <div className="sticky top-24 space-y-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveSection(s.id);
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                activeSection === s.id
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Form body ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-10">
        {/* Status / feedback banners */}
        <StatusBanners business={business} error={error} success={success} />

        {/* ── 1. Basic info ─────────────────────────────────────────── */}
        <section>
          <SectionHeading
            id="basics"
            title="Basic information"
            subtitle="Your business name, category, and description."
          />
          <div className="space-y-5">
            <div>
              <FieldLabel required>Business name</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g. Oslo Auto Repair"
                required
              />
            </div>

            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[120px] resize-y"
                rows={4}
                placeholder="Tell customers what your business offers, your story, and what makes you unique..."
              />
              <p className="text-xs text-gray-400 mt-1">{description.length} / 1000</p>
            </div>
          </div>
        </section>

        {/* ── 2. Media ──────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            id="media"
            title="Media"
            subtitle="Logo, cover image, and photo gallery."
          />
          <div className="space-y-8">
            {/* Logo */}
            <div>
              <FieldLabel>Logo</FieldLabel>
              <p className="text-xs text-gray-400 mb-3">Square image, 400×400 px recommended · max 2 MB · JPG, PNG, WebP</p>
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
                      <span className="flex items-center gap-2"><Spinner small /> Uploading…</span>
                    ) : (
                      logo ? "Change logo" : "Upload logo"
                    )}
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => { const old = logo; setLogo(""); deleteStorageFile(old); }}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors text-left"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cover image */}
            <div>
              <FieldLabel>Cover image</FieldLabel>
              <p className="text-xs text-gray-400 mb-3">Banner shown at the top of your public profile · 1200×400 px recommended · max 5 MB</p>
              <div className="space-y-3">
                <div className="w-full h-36 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {coverImage ? (
                    <Image src={coverImage} alt="Cover" width={800} height={200} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <span className="text-xs text-gray-400">No cover image</span>
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
                      <span className="flex items-center gap-2"><Spinner small /> Uploading…</span>
                    ) : (
                      coverImage ? "Change cover" : "Upload cover"
                    )}
                  </button>
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => { const old = coverImage; setCoverImage(""); deleteStorageFile(old); }}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <FieldLabel>Photo gallery</FieldLabel>
              <p className="text-xs text-gray-400 mb-3">Additional photos of your premises, products, or team · max 5 MB each</p>
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
                  <span className="flex items-center gap-2"><Spinner small /> Uploading…</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add photos
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
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-all shadow"
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
        <section>
          <SectionHeading
            id="location"
            title="Location"
            subtitle="Where customers can find you."
          />
          <div className="space-y-5">
            <div>
              <FieldLabel>Street address</FieldLabel>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
                placeholder="e.g. Karl Johans gate 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>City</FieldLabel>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input"
                  placeholder="Oslo"
                />
              </div>
              <div>
                <FieldLabel>Postal code</FieldLabel>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="input"
                  placeholder="0154"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Google Maps link</FieldLabel>
              <input
                type="url"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                className="input"
                placeholder="https://maps.google.com/..."
              />
              <p className="text-xs text-gray-400 mt-1">Paste the share URL from Google Maps so customers can get directions.</p>
            </div>

            <details className="group">
              <summary className="text-sm text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                GPS coordinates (optional)
              </summary>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <FieldLabel>Latitude</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    value={latitude ?? ""}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || null)}
                    className="input"
                    placeholder="59.9139"
                  />
                </div>
                <div>
                  <FieldLabel>Longitude</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    value={longitude ?? ""}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || null)}
                    className="input"
                    placeholder="10.7522"
                  />
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* ── 4. Contact ────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            id="contact"
            title="Contact information"
            subtitle="How customers can reach you."
          />
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  placeholder="+47 123 45 678"
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="contact@business.no"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Website</FieldLabel>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input"
                placeholder="https://www.yourbusiness.no"
              />
            </div>

            <div>
              <FieldLabel>Booking link</FieldLabel>
              <input
                type="url"
                value={bookingLink}
                onChange={(e) => setBookingLink(e.target.value)}
                className="input"
                placeholder="https://booking.yourbusiness.no"
              />
              <p className="text-xs text-gray-400 mt-1">A direct link for customers to book appointments or reservations.</p>
            </div>
          </div>
        </section>

        {/* ── 5. Opening hours ──────────────────────────────────────── */}
        <section>
          <SectionHeading
            id="hours"
            title="Opening hours"
            subtitle="Set your weekly schedule. Toggle 'Closed' for days you're not open."
          />
          <div className="space-y-2">
            {DAYS.map((day) => {
              const h = openingHours[day] ?? { open: "", close: "", closed: false };
              return (
                <div
                  key={day}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors ${
                    h.closed ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"
                  }`}
                >
                  {/* Day name */}
                  <span className={`w-28 text-sm font-semibold flex-shrink-0 ${h.closed ? "text-gray-400" : "text-gray-800"}`}>
                    {DAY_LABELS[day]}
                  </span>

                  {/* Closed toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                    <div
                      onClick={() => updateHours(day, "closed", !h.closed)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${h.closed ? "bg-gray-300" : "bg-primary-600"}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${h.closed ? "" : "translate-x-4"}`} />
                    </div>
                    <span className={`text-xs font-medium ${h.closed ? "text-gray-400" : "text-primary-700"}`}>
                      {h.closed ? "Closed" : "Open"}
                    </span>
                  </label>

                  {/* Time inputs */}
                  {!h.closed && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => updateHours(day, "open", e.target.value)}
                        className="input py-1.5 px-3 text-sm flex-1"
                      />
                      <span className="text-gray-400 text-sm font-medium">–</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => updateHours(day, "close", e.target.value)}
                        className="input py-1.5 px-3 text-sm flex-1"
                      />
                    </div>
                  )}
                  {h.closed && (
                    <span className="text-sm text-gray-400 italic">Not available</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. Services ───────────────────────────────────────────── */}
        <section>
          <SectionHeading
            id="services"
            title="Services &amp; offers"
            subtitle="List what you offer. Customers will see these on your profile."
          />
          <div className="space-y-3">
            {services.length === 0 && (
              <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No services yet. Add your first one below.</p>
              </div>
            )}

            {services.map((svc, idx) => (
              <div key={svc.id} className="group relative border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <FieldLabel>Service name</FieldLabel>
                        <input
                          type="text"
                          value={svc.name}
                          onChange={(e) => updateService(svc.id, "name", e.target.value)}
                          className="input text-sm"
                          placeholder="e.g. Oil change"
                        />
                      </div>
                      <div>
                        <FieldLabel>Price</FieldLabel>
                        <input
                          type="text"
                          value={svc.price}
                          onChange={(e) => updateService(svc.id, "price", e.target.value)}
                          className="input text-sm"
                          placeholder="e.g. 499 kr"
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <input
                        type="text"
                        value={svc.description}
                        onChange={(e) => updateService(svc.id, "description", e.target.value)}
                        className="input text-sm"
                        placeholder="Short description of this service (optional)"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeService(svc.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Remove service"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addService}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add service
            </button>
          </div>
        </section>

        {/* ── Save bar ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-0 bg-white/95 backdrop-blur border-t border-gray-100 py-4 px-4 sm:px-0 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg flex-1 sm:flex-none sm:min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner small /> Saving…
              </span>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create profile"
            )}
          </button>

          {isEdit && business.status === "APPROVED" && (
            <a
              href={`/en/business/${business.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg hidden sm:inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Preview profile
            </a>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Status banners sub-component ─────────────────────────────────────────────

function StatusBanners({
  business,
  error,
  success,
}: {
  business: Business | null;
  error: string;
  success: string;
}) {
  return (
    <div className="space-y-3">
      {/* Approval status */}
      {business && (
        <ApprovalBanner status={business.status} />
      )}

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

function ApprovalBanner({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  if (status === "APPROVED") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <div>
          <span className="font-semibold">Profile approved</span>
          <span className="text-green-700 ml-2">— Your business is live and visible to the public.</span>
        </div>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="font-semibold">Pending review</span>
          <span className="text-amber-700 ml-2">— An admin will review your profile shortly. You can continue editing while you wait.</span>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="font-semibold">Profile rejected</span>
          <span className="text-red-600 ml-2">— Please update your information and save again to re-submit for review.</span>
        </div>
      </div>
    );
  }

  return null;
}
