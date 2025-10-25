import { AuthProvider } from "../providers/AuthProvider";
import { AuthButtons } from "./AuthButtons";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthenticatedButtonsProps {
  currentPath?: string;
  initialUser?: User | null;
}

/**
 * Wrapper component that combines AuthProvider + AuthButtons
 * This ensures they're in the same React tree and can share context
 */
export function AuthenticatedButtons({ currentPath, initialUser }: AuthenticatedButtonsProps) {
  return (
    <AuthProvider initialUser={initialUser}>
      <AuthButtons currentPath={currentPath} initialUser={initialUser} />
    </AuthProvider>
  );
}
