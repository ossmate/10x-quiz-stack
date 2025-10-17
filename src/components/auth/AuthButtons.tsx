import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface AuthButtonsProps {
  currentPath?: string;
}

interface User {
  id: string;
  email: string;
  username: string;
}

export function AuthButtons({ currentPath }: AuthButtonsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch current auth state from /api/auth/session
    const fetchAuthState = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch auth state:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthState();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (!user) {
    // Unauthenticated state - show Login/Register buttons
    const redirectParam = currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : "";

    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
          <a href={`/auth/login${redirectParam}`}>Login</a>
        </Button>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <a href="/auth/register">Register</a>
        </Button>
      </div>
    );
  }

  // Authenticated state - show user menu
  const initials = user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-popover-foreground">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/" className="cursor-pointer text-popover-foreground hover:bg-accent">
            My Quizzes
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/auth/change-password" className="cursor-pointer text-popover-foreground hover:bg-accent">
            Change Password
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/";
              } catch (error) {
                console.error("Logout failed:", error);
              }
            }}
            className="w-full text-left cursor-pointer text-popover-foreground hover:bg-accent"
          >
            Logout
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
