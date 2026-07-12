"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Branch {
  id:           string;
  businessId:   string;
  name:         string;
  address:      string | null;
  city:         string | null;
  postalCode:   string | null;
  country:      string;
  phone:        string | null;
  email:        string | null;
  latitude:     number | null;
  longitude:    number | null;
  openingHours: Record<string, { open: string; close: string; closed: boolean }> | null;
  isMainBranch: boolean;
  createdAt:    string;
  updatedAt:    string;
}

interface BranchFormState {
  name:        string;
  address:     string;
  city:        string;
  postalCode:  string;
  country:     string;
  phone:       string;
  email:       string;
  isMainBranch: boolean;
}

const EMPTY_FORM: BranchFormState = {
  name:         "",
  address:      "",
  city:         "",
  postalCode:   "",
  country:      "NO",
  phone:        "",
  email:        "",
  isMainBranch: false,
};

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Opening Hours Mini-Editor ────────────────────────────────────────────────

interface HoursEditorProps {
  value: Branch["openingHours"];
  onChange: (v: Branch["openingHours"]) => void;
  locale: string;
}

function HoursEditor({ value, onChange, locale }: HoursEditorProps) {
  const tDays = useTranslations("profile.days");
  const tBranches = useTranslations("branches");
  const hours = value ?? {};

  function update(day: string, field: string, val: string | boolean) {
    const current = hours[day] ?? { open: "09:00", close: "17:00", closed: false };
    onChange({ ...hours, [day]: { ...current, [field]: val } });
  }

  return (
    <div className="space-y-2">
      {DAYS.map((key) => {
        const h = hours[key] ?? { open: "09:00", close: "17:00", closed: false };
        return (
          <div key={key} className="flex items-center gap-3 text-sm">
            <span className="w-24 text-gray-600 font-medium">{tDays(key)}</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!h.closed}
                onChange={(e) => update(key, "closed", e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-500 text-xs">
                {tBranches("closed")}
              </span>
            </label>
            {!h.closed && (
              <>
                <input
                  type="time"
                  value={h.open ?? "09:00"}
                  onChange={(e) => update(key, "open", e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="time"
                  value={h.close ?? "17:00"}
                  onChange={(e) => update(key, "close", e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Branch Form Modal ────────────────────────────────────────────────────────

interface BranchFormModalProps {
  locale:      string;
  businessId:  string;
  initial:     Branch | null;   // null = create mode
  branchCount: number;
  onClose:     () => void;
  onSaved:     (b: Branch) => void;
}

function BranchFormModal({
  locale,
  businessId,
  initial,
  branchCount,
  onClose,
  onSaved,
}: BranchFormModalProps) {
  const t = useTranslations("branches");
  const isEdit = !!initial;

  const [form, setForm] = useState<BranchFormState>(
    initial
      ? {
          name:         initial.name,
          address:      initial.address      ?? "",
          city:         initial.city         ?? "",
          postalCode:   initial.postalCode   ?? "",
          country:      initial.country      ?? "NO",
          phone:        initial.phone        ?? "",
          email:        initial.email        ?? "",
          isMainBranch: initial.isMainBranch,
        }
      : EMPTY_FORM
  );

  const [openingHours, setOpeningHours] = useState<Branch["openingHours"]>(
    initial?.openingHours ?? null
  );
  const [showHours, setShowHours] = useState(!!initial?.openingHours);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  function field(key: keyof BranchFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url    = isEdit ? `/api/branches/${initial!.id}` : "/api/branches";
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        ...(isEdit ? {} : { businessId }),
        name:         form.name.trim(),
        address:      form.address.trim()    || null,
        city:         form.city.trim()       || null,
        postalCode:   form.postalCode.trim() || null,
        country:      form.country           || "NO",
        phone:        form.phone.trim()      || null,
        email:        form.email.trim()      || null,
        openingHours: showHours ? openingHours : null,
        isMainBranch: form.isMainBranch,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("requestFailed"));
      }
      const saved: Branch = await res.json();
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUnknown"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit
              ? t("edit")
              : t("add")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {t("name")} *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {t("address")}
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => field("address", e.target.value)}
              placeholder={t("addressPlaceholder")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>

          {/* City + PostalCode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {t("city")}
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => field("city", e.target.value)}
                placeholder={t("cityPlaceholder")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {t("postalCode")}
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => field("postalCode", e.target.value)}
                placeholder="0150"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {t("phone")}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => field("phone", e.target.value)}
                placeholder="+47 123 45 678"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {t("email")}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => field("email", e.target.value)}
                placeholder="filial@bedrift.no"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Main branch toggle */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={form.isMainBranch}
              onChange={(e) => field("isMainBranch", e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">
                {t("setMain")}
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("setMainDesc")}
              </p>
            </div>
          </label>

          {/* Opening hours toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowHours((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showHours ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {t("openingHours")}
            </button>

            {showHours && (
              <div className="mt-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <HoursEditor
                  value={openingHours}
                  onChange={setOpeningHours}
                  locale={locale}
                />
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Spinner />}
              {saving
                ? t("saving")
                : (isEdit ? t("save") : t("add"))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteModalProps {
  locale:   string;
  branch:   Branch;
  onClose:  () => void;
  onDelete: () => void;
}

function DeleteModal({ locale, branch, onClose, onDelete }: DeleteModalProps) {
  const t = useTranslations("branches");
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/branches/${branch.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUnknown"));
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {t("confirmDelete")}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {`"${branch.name}" ${t("deleteWarning")}`}
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting && <Spinner />}
            {t("deleteAction")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main BranchManager Component ────────────────────────────────────────────

interface BranchManagerProps {
  locale:        string;
  businessId:    string;
  initialBranches: Branch[];
}

export default function BranchManager({
  locale,
  businessId,
  initialBranches,
}: BranchManagerProps) {
  const t = useTranslations("branches");

  const [branches, setBranches]       = useState<Branch[]>(initialBranches);
  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  // Keep local list sorted: main first, then alphabetical
  const sorted = [...branches].sort((a, b) => {
    if (a.isMainBranch && !b.isMainBranch) return -1;
    if (!a.isMainBranch && b.isMainBranch) return 1;
    return a.name.localeCompare(b.name);
  });

  function handleSaved(saved: Branch) {
    setBranches((prev) => {
      // If saved.isMainBranch, demote all others in local state too
      const demoted = saved.isMainBranch
        ? prev.map((b) => ({ ...b, isMainBranch: false }))
        : prev;

      const exists = demoted.find((b) => b.id === saved.id);
      return exists
        ? demoted.map((b) => (b.id === saved.id ? saved : b))
        : [...demoted, saved];
    });
    setShowForm(false);
    setEditTarget(null);
  }

  function handleDeleted(id: string) {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    setDeleteTarget(null);
  }

  function openAdd() {
    setEditTarget(null);
    setShowForm(true);
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("title")}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {branches.length === 0
              ? t("noBranches")
              : branches.length === 1
                ? `1 ${t("branchSingular")}`
                : `${branches.length} ${t("branchPlural")}`}
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("add")}
        </button>
      </div>

      {/* Branch list */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
              d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
          <p className="text-sm text-gray-400 font-medium">
            {t("noBranchesYet")}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t("addFirstBranch")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((branch) => (
            <div
              key={branch.id}
              className={`rounded-2xl border p-4 flex items-start gap-4 transition-all ${
                branch.isMainBranch
                  ? "border-primary-200 bg-primary-50/40"
                  : "border-gray-100 bg-white"
              }`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                branch.isMainBranch ? "bg-primary-100" : "bg-gray-100"
              }`}>
                <svg className={`w-4.5 h-4.5 ${branch.isMainBranch ? "text-primary-700" : "text-gray-500"}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-gray-900">{branch.name}</span>
                  {branch.isMainBranch && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {t("main")}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 text-xs text-gray-500">
                  {(branch.address || branch.city) && (
                    <p className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {[branch.address, branch.postalCode, branch.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {branch.phone && (
                    <p className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {branch.phone}
                    </p>
                  )}
                  {branch.email && (
                    <p className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      {branch.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setEditTarget(branch); setShowForm(true); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title={t("editAction")}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(branch)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title={t("deleteAction")}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <BranchFormModal
          locale={locale}
          businessId={businessId}
          initial={editTarget}
          branchCount={branches.length}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          locale={locale}
          branch={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDelete={() => handleDeleted(deleteTarget.id)}
        />
      )}
    </div>
  );
}
