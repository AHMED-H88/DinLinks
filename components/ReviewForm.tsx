"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  businessId: string;
  locale?: string;
}

export default function ReviewForm({ businessId, locale = "en" }: ReviewFormProps) {
  const router = useRouter();
  const isNo = locale === "no";

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const RATING_LABELS = isNo
    ? ["", "Dårlig", "OK", "Bra", "Meget bra", "Utmerket"]
    : ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

  const t = {
    title:            isNo ? "Skriv en anmeldelse"             : "Write a review",
    yourRating:       isNo ? "Din vurdering"                   : "Your rating",
    yourExperience:   isNo ? "Din opplevelse"                  : "Your experience",
    placeholder:      isNo ? "Del erfaringen din med denne bedriften..." : "Share details about your experience with this business...",
    submit:           isNo ? "Send anmeldelse"                 : "Submit review",
    submitting:       isNo ? "Sender..."                       : "Submitting...",
    successTitle:     isNo ? "Anmeldelse sendt!"               : "Review submitted!",
    successBody:      isNo ? "Takk for at du delte erfaringen din." : "Thank you for sharing your experience.",
    writeAnother:     isNo ? "Skriv en ny anmeldelse"          : "Write another review",
    errorRating:      isNo ? "Velg en vurdering."              : "Please select a rating.",
    errorComment:     isNo ? "Kommentaren må være minst 10 tegn." : "Comment must be at least 10 characters.",
    errorGeneric:     isNo ? "Noe gikk galt. Prøv igjen."     : "Something went wrong. Please try again.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError(t.errorRating); return; }
    if (comment.trim().length < 10) { setError(t.errorComment); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.errorGeneric);
      } else {
        setSuccess(true);
        setRating(0);
        setComment("");
        router.refresh();
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-green-900 mb-1">{t.successTitle}</p>
        <p className="text-sm text-green-700">{t.successBody}</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-green-700 underline hover:no-underline"
        >
          {t.writeAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-5">
      <h4 className="font-semibold text-gray-900">{t.title}</h4>

      {/* Star rating */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">{t.yourRating}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-2xl transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${isNo ? "Gi" : "Rate"} ${star} ${isNo ? "stjerne" : "star"}${star > 1 && !isNo ? "s" : ""}`}
            >
              <span className={(hovered || rating) >= star ? "text-amber-400" : "text-gray-300"}>
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-500 self-center">
              {RATING_LABELS[rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" className="text-sm font-medium text-gray-700 mb-2 block">
          {t.yourExperience}
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={t.placeholder}
          className="input resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/1000</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t.submitting}
          </span>
        ) : (
          t.submit
        )}
      </button>
    </form>
  );
}
