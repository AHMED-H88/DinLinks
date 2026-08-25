"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface SubscriptionLite {
  status: string;
  plan:   string;
  currentPeriodEnd: Date | string | null;
}

/**
 * Account-management billing view. Uses existing subscription data only.
 * - Active subscription → a calm summary (plan cadence, status, next renewal).
 * - No active subscription → an empty state + a restrained "View plans" action
 *   that reveals the real plan options (same /api/subscription/create checkout
 *   the previous card used). No payment-method / invoice / portal / cancel
 *   controls are created, and no Stripe logic is changed.
 */
export default function BillingSummary({
  subscription,
  businessId,
}: {
  subscription: SubscriptionLite | null | undefined;
  businessId:   string | undefined;
}) {
  const t  = useTranslations("dashboard");
  const ts = useTranslations("subscriptionCard");
  const [showPlans, setShowPlans] = useState(false);
  const [loading, setLoading]     = useState(false);

  const subscribe = async (plan: "MONTHLY" | "YEARLY") => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/subscription/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Error creating subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Active subscription → account-management summary ─────────────────────────
  if (subscription && subscription.status === "ACTIVE") {
    const cadence = subscription.plan === "YEARLY" ? t("billingPage.cadenceAnnual") : t("billingPage.cadenceMonthly");
    return (
      <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
        <Row label={t("billingPage.plan")} value={cadence} />
        <Row
          label={t("billingPage.status")}
          value={
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t("billingPage.active")}
            </span>
          }
        />
        {subscription.currentPeriodEnd && (
          <Row
            label={t("billingPage.renews")}
            value={new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          />
        )}
      </div>
    );
  }

  // ── No active subscription → empty state + restrained "View plans" ──────────
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <p className="text-sm text-gray-600">{t("billingPage.noSubscription")}</p>

      {!showPlans ? (
        <button
          type="button"
          onClick={() => setShowPlans(true)}
          className="mt-4 inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          {t("billingPage.viewPlans")}
        </button>
      ) : (
        <div className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
          {([
            { plan: "MONTHLY" as const, title: ts("monthly.title"), price: ts("monthly.price"), cta: ts("monthly.subscribe") },
            { plan: "YEARLY"  as const, title: ts("yearly.title"),  price: ts("yearly.price"),  cta: ts("yearly.subscribe") },
          ]).map((p) => (
            <div key={p.plan} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                <p className="text-sm text-gray-500">{p.price}</p>
              </div>
              <button
                type="button"
                onClick={() => subscribe(p.plan)}
                disabled={loading || !businessId}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
