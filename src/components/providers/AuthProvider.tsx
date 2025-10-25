import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

/**
 * AuthProvider component that provides React Query context for auth state
 * Pre-populates cache with SSR data for instant display
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  // Create a QueryClient instance for auth queries
  // Use useState to ensure same instance is used across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: true,
            refetchOnMount: false,
            retry: 1,
          },
        },
      })
  );

  // Pre-populate cache with SSR data if available
  useEffect(() => {
    if (initialUser !== undefined) {
      const existingData = queryClient.getQueryData(["auth", "session"]);
      // Only set if cache is empty to avoid overwriting fresher data
      if (existingData === undefined) {
        queryClient.setQueryData(["auth", "session"], initialUser);
      }
    }
  }, [initialUser, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
