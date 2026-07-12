"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Subscription {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: Date | null;
}

interface SubscriptionCardProps {
  subscription: Subscription | null | undefined;
  businessId: string | undefined;
}

export default function SubscriptionCard({ subscription, businessId }: SubscriptionCardProps) {
  const t = useTranslations("subscriptionCard");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan: "MONTHLY" | "YEARLY") => {
    if (!businessId) {
      alert(t("createFirst"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (subscription && subscription.status === "ACTIVE") {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{t("title")}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="font-medium">{t("active")}</span>
          </div>
          <p className="text-sm text-gray-600">
            {t("plan")} <span className="font-medium">{subscription.plan}</span>
          </p>
          {subscription.currentPeriodEnd && (
            <p className="text-sm text-gray-600">
              {t("renews")} {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{t("monthly.title")}</h3>
        <p className="text-3xl font-bold text-gray-900 mb-4">{t("monthly.price")}</p>
        <ul className="space-y-2 mb-6 text-sm text-gray-600">
          <li>✓ {t("monthly.feature1")}</li>
          <li>✓ {t("monthly.feature2")}</li>
          <li>✓ {t("monthly.feature3")}</li>
          <li>✓ {t("monthly.feature4")}</li>
        </ul>
        <button
          onClick={() => handleSubscribe("MONTHLY")}
          disabled={loading}
          className="w-full btn btn-primary"
        >
          {t("monthly.subscribe")}
        </button>
      </div>

      <div className="card p-6 border-2 border-blue-500">
        <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3">
          {t("yearly.badge")}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{t("yearly.title")}</h3>
        <p className="text-3xl font-bold text-gray-900 mb-4">{t("yearly.price")}</p>
        <ul className="space-y-2 mb-6 text-sm text-gray-600">
          <li>✓ {t("monthly.feature1")}</li>
          <li>✓ {t("monthly.feature2")}</li>
          <li>✓ {t("monthly.feature3")}</li>
          <li>✓ {t("monthly.feature4")}</li>
          <li>✓ {t("yearly.prioritySupport")}</li>
        </ul>
        <button
          onClick={() => handleSubscribe("YEARLY")}
          disabled={loading}
          className="w-full btn btn-primary"
        >
          {t("yearly.subscribe")}
        </button>
      </div>
    </div>
  );
}
