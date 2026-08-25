"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FocusedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  /** The field's visible label — reused as the dialog title. */
  label: string;
  /** The field's helper copy, repeated in the dialog so context travels with it. */
  hint?: string;
  placeholder?: string;
  maxLength?: number;
  /** Pre-formatted counter, e.g. "120/180". Omitted when the field has none. */
  counter?: string;
  /** Resting height of the inline field, in px. It stays a real multiline box. */
  previewHeight: number;
  labels: { done: string; close: string; edit: string };
}

/** Everything a keyboard can land on, in document order. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A multiline field that is edited in a dedicated writing workspace.
 *
 * Long profile copy was being written through a form-sized slot: the author
 * could see a few lines of their own paragraph and had to scroll a small box
 * to reread it. Growing that box inline only traded one problem for another —
 * the page reflowed under the cursor as the text grew.
 *
 * So the two surfaces do different jobs. The form keeps a real multiline field,
 * big enough to read what is stored at a glance, and activating it opens a
 * workspace sized for writing rather than for the form around it.
 *
 * The workspace is deliberately a fixed share of the viewport, not a box that
 * fits its content: a panel that shrinks to two lines of text is a dialog, and
 * the point of this one is that the page recedes and only the writing is left.
 *
 * It is one more view onto the same form state, not a second store: every
 * keystroke goes to the same `onChange` the inline field used, and closing
 * saves nothing. Save, Save and continue, validation and the API payload
 * remain the only things that persist.
 */
export default function FocusedTextarea({
  value,
  onChange,
  label,
  hint,
  placeholder,
  maxLength,
  counter,
  previewHeight,
  labels,
}: FocusedTextareaProps) {
  const [open, setOpen] = useState(false);
  // Portals need a DOM that exists; on the server it does not.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const triggerRef  = useRef<HTMLButtonElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const titleId = useId();
  const hintId  = useId();

  const close = useCallback(() => {
    setOpen(false);
    // Back to the control that opened it, so the section keeps its place and a
    // keyboard user is not returned to the top of the document.
    triggerRef.current?.focus();
  }, []);

  // ── While open: lock the page, and keep scrolling to ourselves ─────────────
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    // The editor listens for wheel and touchmove on window to move between
    // profile sections. This dialog is portalled to <body>, so those events
    // would still reach window and could change section under the writer.
    // Stopping propagation at the panel keeps the gesture local to the dialog
    // without touching the navigation code, which is deliberately untouched.
    const contain = (e: Event) => e.stopPropagation();
    panel?.addEventListener("wheel", contain, { passive: true });
    panel?.addEventListener("touchmove", contain, { passive: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      panel?.removeEventListener("wheel", contain);
      panel?.removeEventListener("touchmove", contain);
    };
  }, [open]);

  // Focus the writing surface, caret at the end rather than at the start, so
  // continuing to write does not mean navigating there first.
  useEffect(() => {
    if (!open) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [open]);

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;

    // Focus stays inside the dialog: with the page behind it inert to the
    // keyboard, Tab cannot wander into fields the writer cannot see.
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (items.length === 0) return;

    const first = items[0];
    const last  = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      {/* Entry point — a real multiline field, not a preview card. A button
          rather than a read-only textarea: activating it opens an editor,
          which is what a button means, and Enter and Space work without being
          reimplemented. Opening on raw focus was rejected — tabbing through
          the form would have thrown a dialog at every field. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${label} — ${labels.edit}`}
        className="input relative block text-left overflow-hidden hover:border-gray-300 group"
        style={{ height: previewHeight, paddingTop: 11, paddingBottom: 11 }}
      >
        <span
          className={`block whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed pr-7 ${
            value ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {value || placeholder}
        </span>
        <svg
          aria-hidden
          className="pointer-events-none absolute top-3 right-3.5 w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 20h4L18.5 9.5a2.121 2.121 0 00-3-3L5 17v3z" />
        </svg>
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center sm:p-6">
          {/* Backdrop: the page stays legible behind it but clearly secondary. */}
          <div
            className="absolute inset-0 bg-gray-900/45"
            onClick={close}
            aria-hidden
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={hint ? hintId : undefined}
            onKeyDown={onPanelKeyDown}
            // A fixed share of the viewport, not a box that fits its content:
            // sized from the screen, so a short draft gets the same room as a
            // finished one. dvh, not vh — on mobile the software keyboard
            // shrinks the visual viewport, and vh would leave the footer and
            // the counter underneath the keyboard.
            className="relative flex flex-col w-full h-[100dvh] sm:w-[min(1150px,92vw)] sm:h-[90vh] bg-white sm:rounded-2xl border-0 sm:border border-gray-200 shadow-[0_12px_40px_rgba(17,24,39,0.14)]"
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 px-5 sm:px-10 pt-5 sm:pt-7 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-gray-900 tracking-tight">
                  {label}
                </h2>
                {hint && (
                  <p id={hintId} className="text-xs text-gray-500 mt-1 leading-relaxed max-w-2xl">
                    {hint}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={labels.close}
                className="w-9 h-9 -mt-1 -mr-1.5 flex-shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Writing canvas — everything the header and footer leave ──
                min-h-0 is what lets it shrink inside a flex column; without it
                the textarea keeps its content height and pushes the footer off
                the bottom of the panel. */}
            <div className="flex-1 min-h-0 px-5 sm:px-10 py-5 sm:py-7">
              {/* The canvas stays as wide as the panel; the text column inside
                  it does not. Run a paragraph the full width of a 1150px panel
                  and each line is long enough that the eye loses its place on
                  the return sweep. Capping the column and centring it keeps a
                  comfortable measure while the surrounding space — which is
                  what makes the workspace feel like one — is left alone. */}
              <div className="h-full mx-auto w-full max-w-[860px]">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  // Deliberately unstyled as a control: no border, no ring, no
                  // background. Inside the workspace the text is the interface,
                  // so a box drawn around it would only shrink the page it sits on.
                  className="w-full h-full resize-none border-0 p-0 bg-transparent text-base sm:text-[1.0625rem] leading-[1.75] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 overscroll-contain"
                />
              </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between gap-4 px-5 sm:px-10 py-4 border-t border-gray-100 flex-shrink-0"
              // Clears the iPhone home indicator so Done is never half under it.
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
            >
              <span className="text-xs text-gray-400 tabular-nums">{counter ?? ""}</span>
              {/* Charcoal spelled out rather than reusing .btn-primary: that
                  class is blue globally and is only overridden inside the
                  editor's own stylesheet, which this panel is portalled out of. */}
              <button
                type="button"
                onClick={close}
                className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors"
              >
                {labels.done}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
