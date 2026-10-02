"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

/**
 * App-wide toasts and confirmation dialogs, replacing the browser's
 * alert()/confirm() (which look foreign in the installed app and block the
 * page). Call from anywhere in client code:
 *
 *   toast.success("Saved");
 *   if (!(await confirmDialog({ title: "Delete this event?", destructive: true }))) return;
 *
 * <Toaster /> is mounted once in the root layout.
 */

type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; message: string }

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}
interface ConfirmRequest extends ConfirmOptions { resolve: (ok: boolean) => void }

let toasts: ToastItem[] = [];
let pendingConfirm: ConfirmRequest | null = null;
let nextId = 1;
let snapshot: { toasts: ToastItem[]; pendingConfirm: ConfirmRequest | null } = { toasts, pendingConfirm };
const listeners = new Set<() => void>();

function emit() {
  snapshot = { toasts, pendingConfirm };
  listeners.forEach((l) => l());
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, kind, message }];
  emit();
  setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3500);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
};

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  // Only one dialog at a time; a new request cancels the previous one.
  pendingConfirm?.resolve(false);
  return new Promise((resolve) => {
    pendingConfirm = { ...options, resolve };
    emit();
  });
}

function settleConfirm(ok: boolean) {
  const req = pendingConfirm;
  pendingConfirm = null;
  emit();
  req?.resolve(ok);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => snapshot;
const getServerSnapshot = () => snapshot;

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const ICON_COLORS = { success: "#7FB069", error: "#E07A5F", info: "#DDB95A" };

export function Toaster() {
  const { toasts, pendingConfirm } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingConfirm) return;
    // Destructive actions start on "Cancel" so a stray Enter is harmless.
    (pendingConfirm.destructive ? cancelRef : confirmRef).current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settleConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingConfirm]);

  return (
    <>
      {/* Toasts */}
      <div
        className="fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4 pointer-events-none sm:items-end sm:right-6 sm:left-auto"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className="pointer-events-auto w-full max-w-sm flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg animate-fade-up"
              style={{ background: "#1C0F07", border: "1px solid rgba(201,168,76,0.25)", color: "#FAF7F0" }}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: ICON_COLORS[t.kind] }} aria-hidden="true" />
              <p className="text-sm flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 p-0.5 rounded opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog — bottom sheet on phones, centred card on larger screens */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => settleConfirm(false)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={pendingConfirm.message ? "confirm-message" : undefined}
            className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl px-6 pt-6 animate-fade-up"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
          >
            <h2 id="confirm-title" className="font-display text-lg font-bold" style={{ color: "#2C1A0E" }}>
              {pendingConfirm.title}
            </h2>
            {pendingConfirm.message && (
              <p id="confirm-message" className="text-sm mt-2 leading-relaxed" style={{ color: "#7A5C3E" }}>
                {pendingConfirm.message}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                ref={cancelRef}
                onClick={() => settleConfirm(false)}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#F0E6D3", color: "#3D2410" }}
              >
                {pendingConfirm.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmRef}
                onClick={() => settleConfirm(true)}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: pendingConfirm.destructive ? "#B42318" : "#3D2410" }}
              >
                {pendingConfirm.confirmLabel ?? (pendingConfirm.destructive ? "Delete" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
