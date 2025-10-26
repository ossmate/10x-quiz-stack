import { QueryProvider } from "../providers/QueryProvider";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

/**
 * Wrapper component that combines QueryProvider + ForgotPasswordForm
 * This ensures they're in the same React tree and can share context
 */
export function ForgotPasswordWrapper() {
  return (
    <QueryProvider>
      <ForgotPasswordForm />
    </QueryProvider>
  );
}
