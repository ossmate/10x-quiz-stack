import { useQuery, type QueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  username: string;
}

interface UseAuthQueryOptions {
  initialUser?: User | null;
}

const AUTH_STORAGE_KEY = "auth_user";
const STORAGE_VERSION = 1;
const STORAGE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

interface StoredAuthData {
  user: User;
  _version: number;
  _timestamp: number;
}

/**
 * Reads auth user from sessionStorage with validation
 * Returns null if storage is unavailable, expired, or invalid
 */
function readFromStorage(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const data: StoredAuthData = JSON.parse(stored);

    // Check version mismatch
    if (data._version !== STORAGE_VERSION) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    // Check expiration
    const now = Date.now();
    if (now - data._timestamp > STORAGE_EXPIRATION_MS) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return data.user;
  } catch {
    // Invalid JSON or storage error - clear it
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Storage might be disabled
    }
    return null;
  }
}

/**
 * Writes auth user to sessionStorage with version and timestamp
 */
function writeToStorage(user: User | null): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (user) {
      const data: StoredAuthData = {
        user,
        _version: STORAGE_VERSION,
        _timestamp: Date.now(),
      };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Storage might be full or disabled - fail silently
  }
}

/**
 * React Query hook for auth state
 * Provides instant display from sessionStorage or SSR data
 * Automatically caches and syncs auth state
 */
export function useAuthQuery(options?: UseAuthQueryOptions) {
  const { initialUser } = options || {};

  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const response = await fetch("/api/auth/session");
      if (!response.ok) {
        // Clear storage on auth failure
        writeToStorage(null);
        return null;
      }
      const data = await response.json();
      const user = data.user || null;

      // Sync to sessionStorage for instant display
      writeToStorage(user);

      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't refetch if data is fresh
    retry: 1,
    initialData: () => {
      // Try sessionStorage first (instant!)
      const stored = readFromStorage();
      if (stored) {
        return stored;
      }
      // Fallback to SSR data
      return initialUser;
    },
  });
}

/**
 * Helper to clear auth cache on logout
 * Call this when user logs out to clear cache and storage
 */
export function clearAuthCache(queryClient: QueryClient): void {
  queryClient.setQueryData(["auth", "session"], null);
  writeToStorage(null);
}
