"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "PENDING" | "APPROVED" | "REJECTED";

interface BusinessRow {
  id: string;
  name: string | null;
  description: string | null;
  status: Status;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  views: number;
  images: string[];
  services: any;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  category: {
    name: string;
  } | null;
  subscription: {
    status: string;
    plan: string;
  } | null;
  _count: {
    favorites: number;
    reviews: number;
  };
}

type FilterTab = "ALL" | Status;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusMeta(s: Status) {
  if (s === "APPROVED") return { label: "Approved", cls: "bg-green-100 text-green-700 border-green-200" };
  if (s === "PENDING")  return { label: "Pending",  cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return                       { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200" };
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteDialog({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Delete business?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          <span className="font-medium text-gray-700">{name || "This business"}</span> and all its data will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 btn bg-red-600 hover:bg-red-700 text-white border-red-600 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Deleting…
              </span>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail panel (slide-over) ────────────────────────────────────────────────

function DetailPanel({
  business,
  onClose,
  onApprove,
  onReject,
  loadingId,
}: {
  business: BusinessRow;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  loadingId: string | null;
}) {
  const busy = loadingId === business.id;
  const sm   = statusMeta(business.status);
  const services = Array.isArray(business.services) ? business.services : [];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {business.logo ? (
              <Image src={business.logo} alt="" width={36} height={36}
                className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                {(business.name ?? "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">{business.name ?? "—"}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sm.cls}`}>
                {sm.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Owner */}
          <Section title="Owner">
            <Row label="Name"     value={business.user.name  ?? "—"} />
            <Row label="Email"    value={business.user.email}         />
            <Row label="Plan"     value={business.subscription ? `${business.subscription.plan} (${business.subscription.status})` : "Free"} />
          </Section>

          {/* Business info */}
          <Section title="Business details">
            <Row label="Category" value={business.category?.name ?? "—"} />
            <Row label="City"     value={business.city     ?? "—"} />
            <Row label="Phone"    value={business.phone    ?? "—"} />
            <Row label="Email"    value={business.email    ?? "—"} />
            <Row label="Website"  value={business.website  ?? "—"} link={business.website} />
            <Row label="Created"  value={fmtDate(business.createdAt)} />
            <Row label="Updated"  value={fmtDate(business.updatedAt)} />
          </Section>

          {/* Stats */}
          <Section title="Engagement">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Views",      value: business.views },
                { label: "Favourites", value: business._count.favorites },
                { label: "Reviews",    value: business._count.reviews },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Description */}
          {business.description && (
            <Section title="Description">
              <p className="text-sm text-gray-600 leading-relaxed">{business.description}</p>
            </Section>
          )}

          {/* Services */}
          {services.length > 0 && (
            <Section title={`Services (${services.length})`}>
              <div className="space-y-2">
                {services.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">{s.name}</span>
                    {s.price && <span className="text-gray-500">{s.price}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Images */}
          {business.images.length > 0 && (
            <Section title={`Gallery (${business.images.length})`}>
              <div className="grid grid-cols-3 gap-2">
                {business.images.slice(0, 6).map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image src={img} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t border-gray-100 p-4 flex gap-3">
          {business.status !== "APPROVED" && (
            <button
              disabled={busy}
              onClick={() => onApprove(business.id)}
              className="flex-1 btn btn-sm bg-green-600 hover:bg-green-700 text-white border-green-600 disabled:opacity-50 justify-center"
            >
              {busy ? <BtnSpinner /> : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </>
              )}
            </button>
          )}
          {business.status !== "REJECTED" && (
            <button
              disabled={busy}
              onClick={() => onReject(business.id)}
              className="flex-1 btn btn-sm bg-red-600 hover:bg-red-700 text-white border-red-600 disabled:opacity-50 justify-center"
            >
              {busy ? <BtnSpinner /> : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </>
              )}
            </button>
          )}
          {business.status === "APPROVED" && (
            <a
              href={`/en/business/${business.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn btn-secondary btn-sm justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              View live
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, link }: { label: string; value: string; link?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-400 flex-shrink-0 w-20">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="text-primary-700 font-medium hover:underline text-right break-all">
          {value}
        </a>
      ) : (
        <span className="font-medium text-gray-800 text-right break-all">{value}</span>
      )}
    </div>
  );
}

function BtnSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }) {
  const messages: Record<FilterTab, { icon: string; title: string; body: string }> = {
    ALL:      { icon: "🏢", title: "No businesses yet",       body: "Businesses will appear here once owners register." },
    PENDING:  { icon: "⏳", title: "No pending reviews",      body: "All submissions have been reviewed. Great work!" },
    APPROVED: { icon: "✅", title: "No approved businesses",  body: "Approve pending submissions to make them public." },
    REJECTED: { icon: "❌", title: "No rejected businesses",  body: "No businesses have been rejected." },
  };
  const m = messages[filter];
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-4">{m.icon}</div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{m.title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mx-auto">{m.body}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BusinessTable({ businesses }: { businesses: BusinessRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [filter,     setFilter]     = useState<FilterTab>("PENDING");
  const [search,     setSearch]     = useState("");
  const [loadingId,  setLoadingId]  = useState<string | null>(null);
  const [toastMsg,   setToastMsg]   = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detailBiz,  setDetailBiz]  = useState<BusinessRow | null>(null);

  // ── Counts for tab badges ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    ALL:      businesses.length,
    PENDING:  businesses.filter((b) => b.status === "PENDING").length,
    APPROVED: businesses.filter((b) => b.status === "APPROVED").length,
    REJECTED: businesses.filter((b) => b.status === "REJECTED").length,
  }), [businesses]);

  // ── Filtered + searched list ─────────────────────────────────────────────
  const displayed = useMemo(() => {
    const q = search.toLowerCase().trim();
    return businesses
      .filter((b) => filter === "ALL" || b.status === filter)
      .filter((b) => {
        if (!q) return true;
        return (
          b.name?.toLowerCase().includes(q) ||
          b.user.email.toLowerCase().includes(q) ||
          b.user.name?.toLowerCase().includes(q) ||
          b.city?.toLowerCase().includes(q) ||
          b.category?.name.toLowerCase().includes(q)
        );
      });
  }, [businesses, filter, search]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  function showToast(text: string, ok: boolean) {
    setToastMsg({ text, ok });
    setTimeout(() => setToastMsg(null), 4000);
  }

  // ── API actions ──────────────────────────────────────────────────────────
  async function handleApprove(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}/approve`, { method: "POST" });
      if (res.ok) {
        showToast("Business approved and is now live.", true);
        // Close detail panel if it was showing this business
        if (detailBiz?.id === id) setDetailBiz(null);
        startTransition(() => router.refresh());
      } else {
        showToast("Failed to approve. Please try again.", false);
      }
    } catch {
      showToast("Network error.", false);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}/reject`, { method: "POST" });
      if (res.ok) {
        showToast("Business rejected. The owner will see the status in their dashboard.", true);
        if (detailBiz?.id === id) setDetailBiz(null);
        startTransition(() => router.refresh());
      } else {
        showToast("Failed to reject. Please try again.", false);
      }
    } catch {
      showToast("Network error.", false);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(business: BusinessRow) {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`"${business.name}" deleted.`, true);
        setDeleteTarget(null);
        if (detailBiz?.id === business.id) setDetailBiz(null);
        startTransition(() => router.refresh());
      } else {
        showToast("Failed to delete. Please try again.", false);
        setDeleteTarget(null);
      }
    } catch {
      showToast("Network error.", false);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "PENDING",  label: "Pending"  },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
    { key: "ALL",      label: "All"      },
  ];

  return (
    <>
      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border transition-all ${
            toastMsg.ok
              ? "bg-white border-green-200 text-green-800"
              : "bg-white border-red-200 text-red-700"
          }`}
        >
          {toastMsg.ok ? (
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toastMsg.text}
        </div>
      )}

      {/* ── Delete dialog ───────────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.name ?? ""}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Detail panel ────────────────────────────────────────────────── */}
      {detailBiz && (
        <DetailPanel
          business={detailBiz}
          onClose={() => setDetailBiz(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          loadingId={loadingId}
        />
      )}

      {/* ── Filter tabs + search ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === key
                    ? key === "PENDING"  ? "bg-amber-100 text-amber-700"
                    : key === "APPROVED" ? "bg-green-100 text-green-700"
                    : key === "REJECTED" ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, owner, city…"
            className="input pl-9 py-2 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 sm:ml-auto">
          {displayed.length} {displayed.length === 1 ? "result" : "results"}
        </p>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Business", "Owner", "Category / City", "Status", "Submitted", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((b, idx) => {
                const sm  = statusMeta(b.status);
                const busy = loadingId === b.id;
                return (
                  <tr
                    key={b.id}
                    className={`border-b border-gray-50 transition-colors hover:bg-gray-50/80 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    {/* Business name + logo */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                          {b.logo ? (
                            <Image src={b.logo} alt="" width={32} height={32} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">
                              {(b.name ?? "?").slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setDetailBiz(b)}
                          className="text-sm font-semibold text-gray-900 hover:text-primary-700 transition-colors text-left truncate max-w-[140px]"
                          title={b.name ?? ""}
                        >
                          {b.name ?? <span className="text-gray-400 italic">Unnamed</span>}
                        </button>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col min-w-0">
                        {b.user.name && (
                          <span className="text-sm font-medium text-gray-800 truncate">{b.user.name}</span>
                        )}
                        <span className="text-xs text-gray-400 truncate max-w-[160px]">{b.user.email}</span>
                      </div>
                    </td>

                    {/* Category / city */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">{b.category?.name ?? <span className="text-gray-400 italic">No category</span>}</span>
                        {b.city && <span className="text-xs text-gray-400">{b.city}</span>}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${sm.cls}`}>
                        {sm.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {fmtDate(b.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* View details */}
                        <button
                          onClick={() => setDetailBiz(b)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all"
                        >
                          Details
                        </button>

                        {/* Approve */}
                        {b.status !== "APPROVED" && (
                          <button
                            disabled={busy}
                            onClick={() => handleApprove(b.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-all disabled:opacity-40 flex items-center gap-1"
                          >
                            {busy ? <BtnSpinner /> : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Approve
                          </button>
                        )}

                        {/* Reject */}
                        {b.status !== "REJECTED" && (
                          <button
                            disabled={busy}
                            onClick={() => handleReject(b.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-40 flex items-center gap-1"
                          >
                            {busy ? <BtnSpinner /> : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            Reject
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
