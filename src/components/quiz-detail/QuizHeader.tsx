import type { QuizDTO } from "../../types.ts";
import { QuizMetadata } from "./QuizMetadata.tsx";
import { QuizActionItems } from "./QuizActionItems.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizHeaderProps {
  quiz: QuizDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
}

/**
 * Header component for quiz detail view
 * Displays quiz title, description, metadata badges, and kebab menu with actions
 */
export function QuizHeader({ quiz, isOwner, onEdit, onDelete, onStartQuiz, onPublish, onUnpublish }: QuizHeaderProps) {
  return (
    <header className="border-b border-border pb-6">
      {/* Title and Kebab Menu */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground mb-2">{quiz.title}</h1>
          {quiz.description && <p className="text-lg text-muted-foreground mt-2">{quiz.description}</p>}
        </div>

        {/* Kebab Menu - Hidden on mobile (≤ sm screens) since footer is always present */}
        <div className="hidden sm:block shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Quiz actions menu">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <QuizActionItems
                quiz={quiz}
                isOwner={isOwner}
                onEdit={onEdit}
                onDelete={onDelete}
                onStartQuiz={onStartQuiz}
                onPublish={onPublish}
                onUnpublish={onUnpublish}
                variant="menu"
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metadata Badges */}
      <QuizMetadata quiz={quiz} className="mb-4" />
    </header>
  );
}
