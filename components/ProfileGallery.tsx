"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

interface ProfileGalleryProps {
  images: string[];
  businessName: string;
  labelPhotos: string;   // i18n label e.g. "Photos" / "Bilder"
  labelClose: string;    // i18n label e.g. "Close" / "Lukk"
  labelPrev: string;
  labelNext: string;
}

export default function ProfileGallery({
  images,
  businessName,
  labelPhotos,
  labelClose,
  labelPrev,
  labelNext,
}: ProfileGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Track which original indices failed to load
  const [failed, setFailed] = useState<Set<number>>(new Set());

  // Filter out broken images
  const validImages = images.filter((_, i) => !failed.has(i));

  const prev = useCallback(() => {
    setLightbox((i) => (i === null ? null : (i - 1 + validImages.length) % validImages.length));
  }, [validImages.length]);

  const next = useCallback(() => {
    setLightbox((i) => (i === null ? null : (i + 1) % validImages.length));
  }, [validImages.length]);

  const close = useCallback(() => setLightbox(null), []);

  // Keyboard navigation
  useEffect(() => {
    if (lightbox === null) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape")     close();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, close, prev, next]);

  if (validImages.length === 0) return null;

  // Layout: first image large, rest in grid (up to 5 total shown before overflow indicator)
  const MAX_VISIBLE = 5;
  const visible   = validImages.slice(0, MAX_VISIBLE);
  const remaining = validImages.length - MAX_VISIBLE;

  return (
    <section id="photos" className="scroll-mt-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900">{labelPhotos}</h2>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {validImages.length}
        </span>
      </div>

      {/* Grid */}
      {validImages.length === 1 ? (
        <button
          type="button"
          onClick={() => setLightbox(0)}
          className="w-full relative aspect-[16/7] rounded-2xl overflow-hidden bg-gray-100 group block"
        >
          <Image
            src={validImages[0]}
            alt={`${businessName} — photo 1`}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={() => {
              const origIdx = images.indexOf(validImages[0]);
              setFailed((prev) => new Set(prev).add(origIdx));
            }}
          />
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visible.map((img, idx) => {
            const origIdx = images.indexOf(img);
            return (
              <button
                key={origIdx}
                type="button"
                onClick={() => setLightbox(idx)}
                className={`relative overflow-hidden rounded-xl bg-gray-100 group ${
                  idx === 0 ? "col-span-2 sm:col-span-2 aspect-[4/3]" : "aspect-square"
                }`}
              >
                <Image
                  src={img}
                  alt={`${businessName} — photo ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  onError={() => setFailed((prev) => new Set(prev).add(origIdx))}
                />
                {/* Overflow indicator on last visible tile */}
                {idx === MAX_VISIBLE - 1 && remaining > 0 && (
                  <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">+{remaining}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && validImages[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label={labelClose}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
            {lightbox + 1} / {validImages.length}
          </div>

          {/* Prev */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label={labelPrev}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={validImages[lightbox]}
              alt={`${businessName} — photo ${lightbox + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
              onError={() => {
                const origIdx = images.indexOf(validImages[lightbox!]);
                setFailed((prev) => new Set(prev).add(origIdx));
                close();
              }}
            />
          </div>

          {/* Next */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label={labelNext}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
