import { useMutation } from "@tanstack/react-query";
import type { ChangePasswordInput } from "../validation/auth.schema";

interface ChangePasswordResponse {
  message: string;
}

interface ChangePasswordError {
  error: string;
  message: string;
  details?: Record<string, string>;
}

/**
 * React Query mutation hook for changing user password
 * @returns Mutation object with mutate, mutateAsync, isLoading, error, etc.
 */
export function useChangePassword() {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordInput>({
    mutationFn: async (data: ChangePasswordInput) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ChangePasswordError;
        throw new Error(errorData.message || "Password change failed");
      }

      return response.json();
    },
  });
}
