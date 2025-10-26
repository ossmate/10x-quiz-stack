import { useMutation } from "@tanstack/react-query";
import type { ForgotPasswordInput } from "../validation/auth.schema";

interface ForgotPasswordResponse {
  message: string;
}

interface ForgotPasswordError {
  error: string;
  message: string;
  details?: Record<string, string>;
}

/**
 * React Query mutation hook for requesting password reset
 * @returns Mutation object with mutate, mutateAsync, isLoading, error, etc.
 */
export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordInput>({
    mutationFn: async (data: ForgotPasswordInput) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ForgotPasswordError;
        throw new Error(errorData.message || "Failed to send password reset email");
      }

      return response.json();
    },
  });
}
