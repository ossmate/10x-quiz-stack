import { QueryProvider } from "../providers/QueryProvider";
import { ChangePasswordForm } from "./ChangePasswordForm";

/**
 * Wrapper component that combines QueryProvider + ChangePasswordForm
 * This ensures they're in the same React tree and can share context
 */
export function ChangePasswordWrapper() {
  return (
    <QueryProvider>
      <ChangePasswordForm />
    </QueryProvider>
  );
}
