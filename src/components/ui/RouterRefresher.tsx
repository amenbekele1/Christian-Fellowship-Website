"use client";

import { useRouter } from "next/navigation";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { usePushRefresh } from "@/hooks/usePushRefresh";

/**
 * Invokes router.refresh() whenever the app regains focus or a refresh
 * push arrives. This re-runs every server component on the current route
 * with fresh DB data and seamlessly swaps it in — no full reload.
 * Client-fetched pages (library, admin/books) should additionally wire
 * usePushRefresh / useRefreshOnFocus to their own refetch function.
 */
export function RouterRefresher() {
  const router = useRouter();
  const refresh = () => router.refresh();
  useRefreshOnFocus(refresh);
  usePushRefresh("*", refresh);
  return null;
}
