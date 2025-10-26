import { useMemo } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = "weak" | "medium" | "strong";

interface StrengthResult {
  level: StrengthLevel;
  score: number;
  label: string;
  color: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo((): StrengthResult => {
    if (!password) {
      return { level: "weak", score: 0, label: "No password", color: "bg-muted" };
    }

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    // Calculate score based on checks
    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    // Additional points for longer passwords
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Determine strength level
    if (score <= 2) {
      return { level: "weak", score, label: "Weak", color: "bg-destructive" };
    } else if (score <= 4) {
      return { level: "medium", score, label: "Medium", color: "bg-accent" };
    } else {
      return { level: "strong", score, label: "Strong", color: "bg-primary" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.score / 7) * 100}%` }}
          />
        </div>
        <span
          className={`text-xs font-medium ${
            strength.level === "weak"
              ? "text-destructive"
              : strength.level === "medium"
                ? "text-accent"
                : "text-primary"
          }`}
        >
          {strength.label}
        </span>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Password requirements:</p>
        <ul className="space-y-0.5">
          <li className={password.length >= 8 ? "text-primary" : ""}>
            {password.length >= 8 ? "✓" : "○"} At least 8 characters
          </li>
          <li className={/[A-Z]/.test(password) ? "text-primary" : ""}>
            {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter
          </li>
          <li className={/[a-z]/.test(password) ? "text-primary" : ""}>
            {/[a-z]/.test(password) ? "✓" : "○"} One lowercase letter
          </li>
          <li className={/[0-9]/.test(password) ? "text-primary" : ""}>
            {/[0-9]/.test(password) ? "✓" : "○"} One number
          </li>
        </ul>
      </div>
    </div>
  );
}
