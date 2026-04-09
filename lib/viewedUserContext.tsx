"use client";

import { createContext, useContext } from "react";

/**
 * Provides the user ID to fetch data for.
 * null = fetch for the currently signed-in user (default behavior).
 * A UUID string = fetch for that user (used in partner view to show the inviter's data).
 */
export const ViewedUserContext = createContext<string | null>(null);

export function useViewedUserId(): string | null {
  return useContext(ViewedUserContext);
}
