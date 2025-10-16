import { useState, useCallback } from "react";
import type { NavigationLink, UserProfile } from "../../types/management.types";

interface HeaderNavigationProps {
  currentPath: string;
  userProfile?: UserProfile;
}

export function HeaderNavigation({ currentPath, userProfile }: HeaderNavigationProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navigationLinks: NavigationLink[] = [
    { title: "Dashboard", path: "/", isActive: currentPath === "/" },
    { title: "Create Quiz", path: "/quizzes/new", isActive: currentPath === "/quizzes/new" },
    { title: "Generate Quiz", path: "/quizzes/ai/generate", isActive: currentPath === "/quizzes/ai/generate" },
  ];

  const toggleProfileMenu = useCallback(() => {
    setIsProfileMenuOpen((prev) => !prev);
  }, []);

  const closeProfileMenu = useCallback(() => {
    setIsProfileMenuOpen(false);
  }, []);

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center text-xl font-bold text-foreground">
              <span className="text-primary">10x</span>
              <span className="ml-1">Quiz</span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex md:space-x-8" aria-label="Main navigation">
            {navigationLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                  link.isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                aria-current={link.isActive ? "page" : undefined}
              >
                {link.title}
              </a>
            ))}
          </nav>

          {/* Profile Menu */}
          <div className="relative">
            {userProfile ? (
              <div>
                <button
                  type="button"
                  onClick={toggleProfileMenu}
                  className="flex items-center rounded-full bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  id="user-menu-button"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  {userProfile.avatarUrl ? (
                    <img className="h-8 w-8 rounded-full" src={userProfile.avatarUrl} alt={userProfile.username} />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Dropdown menu */}
                {isProfileMenuOpen && (
                  <>
                    {/* Backdrop to close menu on outside click */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={closeProfileMenu}
                      onKeyDown={(e) => e.key === "Escape" && closeProfileMenu()}
                      role="button"
                      tabIndex={0}
                      aria-label="Close menu"
                    />

                    <div
                      className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-popover py-1 shadow-lg ring-1 ring-border focus:outline-none"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="border-b border-border px-4 py-2">
                        <p className="text-sm font-medium text-popover-foreground">
                          {userProfile.displayName || userProfile.username}
                        </p>
                        <p className="text-xs text-muted-foreground">@{userProfile.username}</p>
                      </div>
                      <a
                        href="/profile"
                        className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                        role="menuitem"
                      >
                        Profile Settings
                      </a>
                      <a
                        href="/api/auth/logout"
                        className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                        role="menuitem"
                      >
                        Sign Out
                      </a>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <a
                href="/login"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="border-t border-border md:hidden" aria-label="Mobile navigation">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigationLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                link.isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-current={link.isActive ? "page" : undefined}
            >
              {link.title}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
