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
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center text-xl font-bold text-gray-900">
              <span className="text-blue-600">10x</span>
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
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  className="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  id="user-menu-button"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  {userProfile.avatarUrl ? (
                    <img className="h-8 w-8 rounded-full" src={userProfile.avatarUrl} alt={userProfile.username} />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
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
                      className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="border-b px-4 py-2">
                        <p className="text-sm font-medium text-gray-900">
                          {userProfile.displayName || userProfile.username}
                        </p>
                        <p className="text-xs text-gray-500">@{userProfile.username}</p>
                      </div>
                      <a
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Profile Settings
                      </a>
                      <a
                        href="/api/auth/logout"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="border-t md:hidden" aria-label="Mobile navigation">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigationLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                link.isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
