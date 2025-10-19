import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { QuizDetailDTO } from "../../types";

interface QuizVisibilityToggleProps {
  quiz: QuizDetailDTO;
  onVisibilityChange: (newStatus: "public" | "private") => Promise<void>;
}

/**
 * Dropdown toggle to switch quiz visibility between public and private
 * Only available for published quizzes (status is public or private)
 */
export function QuizVisibilityToggle({ quiz, onVisibilityChange }: QuizVisibilityToggleProps) {
  const [isChanging, setIsChanging] = useState(false);

  // Only show for published quizzes (public or private status)
  if (quiz.status !== "public" && quiz.status !== "private") {
    return null;
  }

  const handleVisibilityChange = async (newStatus: "public" | "private") => {
    if (newStatus === quiz.status) {
      return; // No change needed
    }

    setIsChanging(true);
    try {
      await onVisibilityChange(newStatus);
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Visibility change failed:", error);
    } finally {
      setIsChanging(false);
    }
  };

  const currentStatus = quiz.status;
  const isPublic = currentStatus === "public";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          disabled={isChanging}
          aria-label="Change quiz visibility"
        >
          {isChanging ? "Updating..." : `Visibility: ${isPublic ? "Public" : "Private"}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleVisibilityChange("public")}
          disabled={isChanging || isPublic}
        >
          <div className="flex flex-col">
            <span className="font-medium">Public</span>
            <span className="text-xs text-muted-foreground">Anyone can view and take this quiz</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleVisibilityChange("private")}
          disabled={isChanging || !isPublic}
        >
          <div className="flex flex-col">
            <span className="font-medium">Private</span>
            <span className="text-xs text-muted-foreground">Only you can access this quiz</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
