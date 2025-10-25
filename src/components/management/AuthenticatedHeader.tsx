import { AuthProvider } from "../providers/AuthProvider";
import { HeaderNavigation } from "./HeaderNavigation";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthenticatedHeaderProps {
  currentPath: string;
  initialUser?: User | null;
}

/**
 * Wrapper component that combines AuthProvider + HeaderNavigation
 * This ensures they're in the same React tree and can share context
 */
export function AuthenticatedHeader({ currentPath, initialUser }: AuthenticatedHeaderProps) {
  return (
    <AuthProvider initialUser={initialUser}>
      <HeaderNavigation currentPath={currentPath} initialUser={initialUser} />
    </AuthProvider>
  );
}
