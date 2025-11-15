import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface AuthContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  showLogo?: boolean;
}

export function AuthContainer({ title, description, children, showLogo = true }: AuthContainerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {showLogo && (
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center text-2xl font-bold text-foreground">
              <span className="text-primary">10x</span>
              <span className="ml-1">Quiz Stack</span>
            </a>
          </div>
        )}

        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
            {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
