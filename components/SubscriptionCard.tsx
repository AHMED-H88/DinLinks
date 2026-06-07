"use client";

import { useState } from "react";

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
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan: "MONTHLY" | "YEARLY") => {
    if (!businessId) {
      alert("Please create your business profile first");
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
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Subscription</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="font-medium">Active</span>
          </div>
          <p className="text-sm text-gray-600">
            Plan: <span className="font-medium">{subscription.plan}</span>
          </p>
          {subscription.currentPeriodEnd && (
            <p className="text-sm text-gray-600">
              Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Plan</h3>
        <p className="text-3xl font-bold text-gray-900 mb-4">$29/month</p>
        <ul className="space-y-2 mb-6 text-sm text-gray-600">
          <li>✓ Profile listing</li>
          <li>✓ Image gallery</li>
          <li>✓ Contact information</li>
          <li>✓ Customer reviews</li>
        </ul>
        <button
          onClick={() => handleSubscribe("MONTHLY")}
          disabled={loading}
          className="w-full btn btn-primary"
        >
          Subscribe Monthly
        </button>
      </div>

      <div className="card p-6 border-2 border-blue-500">
        <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3">
          Save 20%
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Yearly Plan</h3>
        <p className="text-3xl font-bold text-gray-900 mb-4">$279/year</p>
        <ul className="space-y-2 mb-6 text-sm text-gray-600">
          <li>✓ Profile listing</li>
          <li>✓ Image gallery</li>
          <li>✓ Contact information</li>
          <li>✓ Customer reviews</li>
          <li>✓ Priority support</li>
        </ul>
        <button
          onClick={() => handleSubscribe("YEARLY")}
          disabled={loading}
          className="w-full btn btn-primary"
        >
          Subscribe Yearly
        </button>
      </div>
    </div>
  );
}
