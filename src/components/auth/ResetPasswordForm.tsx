import { useState } from "react";
import { resetPasswordSchema, type ResetPasswordInput } from "../../lib/validation/auth.schema";
import { AuthContainer } from "./AuthContainer";
import { FormFieldError } from "./FormFieldError";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

interface ResetPasswordFormProps {
  hasValidSession: boolean;
}

export function ResetPasswordForm({ hasValidSession }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<Omit<ResetPasswordInput, "token">>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordInput, string>>>({});
  const [formError, setFormError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const handleInputChange = (field: keyof Omit<ResetPasswordInput, "token">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) {
      setFormError("");
    }
  };

  const handlePasswordFocus = () => {
    setShowPasswordStrength(true);
  };

  const validateForm = (): boolean => {
    try {
      // Validate just password fields (token is handled server-side)
      resetPasswordSchema.parse({
        token: "placeholder", // Required by schema but handled server-side
        ...formData,
      });
      setErrors({});
      return true;
    } catch (error) {
      const fieldErrors: Partial<Record<keyof ResetPasswordInput, string>> = {};
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: { path: (string | number)[]; message: string }[] };
        zodError.issues?.forEach((err) => {
          const field = err.path[0] as keyof ResetPasswordInput;
          if (field !== "token") {
            fieldErrors[field] = err.message;
          }
        });
      }
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
        credentials: "include", // Important: include cookies for session
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Password reset failed");
        return;
      }

      // Redirect to login with success message
      window.location.href = "/auth/login?message=password-reset-success";
    } catch {
      setFormError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidSession) {
    return (
      <AuthContainer title="Invalid Reset Link">
        <Alert variant="destructive" className="bg-destructive/10 border-destructive">
          <AlertDescription className="text-destructive">
            This password reset link is invalid or has expired.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            The link you clicked may have expired or already been used.
          </p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <a href="/auth/forgot-password">Request a new reset link</a>
          </Button>
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer title="Reset your password" description="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive">
            <AlertDescription className="text-destructive">{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            New Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            onFocus={handlePasswordFocus}
            className={`bg-background text-foreground border-input focus:border-primary ${
              errors.password ? "border-destructive" : ""
            }`}
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && <FormFieldError error={errors.password} />}
          {showPasswordStrength && <PasswordStrengthIndicator password={formData.password} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground">
            Confirm New Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            className={`bg-background text-foreground border-input focus:border-primary ${
              errors.confirmPassword ? "border-destructive" : ""
            }`}
            disabled={isLoading}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          />
          {errors.confirmPassword && <FormFieldError error={errors.confirmPassword} />}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Resetting password..." : "Reset password"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <a href="/auth/login" className="text-primary hover:text-primary/80 underline font-medium">
            Login
          </a>
        </p>
      </form>
    </AuthContainer>
  );
}
