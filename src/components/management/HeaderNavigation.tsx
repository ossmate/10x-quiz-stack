import type { NavigationLink } from "../../types/management.types";
import { AuthButtons } from "../auth/AuthButtons";

interface HeaderNavigationProps {
  currentPath: string;
}

export function HeaderNavigation({ currentPath }: HeaderNavigationProps) {
  const navigationLinks: NavigationLink[] = [
    { title: "Dashboard", path: "/", isActive: currentPath === "/" },
    { title: "Create Quiz", path: "/quizzes/new", isActive: currentPath === "/quizzes/new" },
    { title: "Generate Quiz", path: "/quizzes/ai/generate", isActive: currentPath === "/quizzes/ai/generate" },
  ];

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

          {/* Auth Buttons - Upper Right Corner */}
          <div className="flex items-center">
            <AuthButtons currentPath={currentPath} />
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
