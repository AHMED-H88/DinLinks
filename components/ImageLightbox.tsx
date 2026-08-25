"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface ImageLightboxProps {
  /** The whole run to browse. A single entry simply hides the navigation. */
  images: string[];
  /** Which one to open on. */
  startIndex: number;
  /** Names the picture for assistive technology; `{index}`/`{total}` if given. */
  label: (index: number, total: number) => string;
  onClose: () => void;
  labels: { close: string; previous: string; next: string };
}

/** Finger travel that counts as a swipe rather than a tap or a stray drag. */
const SWIPE_THRESHOLD = 48;

/**
 * A viewer for a run of images.
 *
 * Media thumbnails are small, and the only control on them used to replace the
 * file, so there was no way to actually look at what had been uploaded. This
 * shows one picture at a size worth looking at and lets the reader move along
 * the gallery without closing and reopening for each one.
 *
 * Deliberately minimal: no thumbnail strip, no captions, no zoom, no download,
 * no slideshow. It is a way to see the pictures, not a second interface.
 *
 * Portalled to <body> so the workspace's sticky header and section grid cannot
 * clip it or trap it under a stacking context.
 */
export default function ImageLightbox({
  images,
  startIndex,
  label,
  onClose,
  labels,
}: ImageLightboxProps) {
  // Clamped: the caller's index and the array come from the same render, but
  // this keeps an out-of-range value from blanking the viewer.
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(startIndex, 0), Math.max(images.length - 1, 0))
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX   = useRef<number | null>(null);
  const touchY   = useRef<number | null>(null);

  const total   = images.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  // No wrapping in either direction: the ends of the gallery are real, and
  // looping would make it impossible to tell where the run stops.
  const goPrev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(
    () => setIndex((i) => (i < images.length - 1 ? i + 1 : i)),
    [images.length]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape")     { e.preventDefault(); onClose(); return; }
    if (e.key === "ArrowLeft")  { e.preventDefault(); goPrev();  return; }
    if (e.key === "ArrowRight") { e.preventDefault(); goNext();  return; }

    // Focus stays inside the dialog. The controls are few and always in the
    // same order, so cycling them is the whole trap.
    if (e.key === "Tab") {
      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []
      );
      if (items.length === 0) return;
      const first = items[0];
      const last  = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  // Horizontal swipe moves along the gallery; a mostly-vertical drag is left
  // alone so it cannot be mistaken for navigation.
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
    touchY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = touchX.current;
    const startY = touchY.current;
    touchX.current = null;
    touchY.current = null;
    if (startX == null || startY == null) return;

    const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
    const dy = (e.changedTouches[0]?.clientY ?? startY) - startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;

    if (dx < 0) goNext();
    else goPrev();
  };

  useEffect(() => {
    // Whatever had focus is the thumbnail that opened this, so remembering it
    // here means focus returns to the right picture without every caller
    // having to hold a ref and hand it over.
    const opener = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  const src = images[index];
  if (!src) return null;

  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center " +
    "bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 " +
    "disabled:opacity-0 disabled:pointer-events-none transition-colors";

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={label(index, total)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
    >
      <div className="absolute inset-0 bg-gray-900/80" onClick={onClose} aria-hidden />

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Arrows are shown as well as swipe, so touch users are never left with
          a gesture as the only way through. */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={!hasPrev}
            aria-label={labels.previous}
            className={`${arrow} left-2 sm:left-5`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!hasNext}
            aria-label={labels.next}
            className={`${arrow} right-2 sm:right-5`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span
            aria-live="polite"
            className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-xs tabular-nums"
          >
            {index + 1} / {total}
          </span>
        </>
      )}

      {/* The image sizes itself to the space rather than the space to the
          image, so a tall portrait and a wide banner both fit without the
          dialog jumping between shapes. */}
      <div className="relative w-full h-full max-w-5xl pointer-events-none">
        <Image
          key={src}
          src={src}
          alt={label(index, total)}
          fill
          sizes="(max-width: 640px) 100vw, 80vw"
          className="object-contain"
        />
      </div>
    </div>,
    document.body
  );
}
