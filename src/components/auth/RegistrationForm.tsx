import { useState } from "react";
import { registerSchema, type RegisterInput } from "../../lib/validation/auth.schema";
import { AuthContainer } from "./AuthContainer";
import { FormFieldError } from "./FormFieldError";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

export function RegistrationForm() {
  const [formData, setFormData] = useState<RegisterInput>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [formError, setFormError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const handleInputChange = (field: keyof RegisterInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) {
      setFormError("");
    }
  };

  const validateForm = (): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: { path: (string | number)[]; message: string }[] };
        zodError.issues?.forEach((err) => {
          const field = err.path[0] as keyof RegisterInput;
          // Only set the error if we don't already have one for this field
          // This ensures we show the first error for each field
          if (!fieldErrors[field]) {
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
      // Include confirmPassword in the request body for backend validation
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          // Email already exists
          setErrors((prev) => ({ ...prev, email: data.message }));
        } else if (data.details) {
          // Validation errors
          setErrors(data.details);
        } else {
          setFormError(data.message || "Registration failed");
        }
        setIsLoading(false);
        return;
      }

      // Registration successful - keep loading state until redirect completes
      // Don't call setIsLoading(false) here to prevent form from showing cleared state
      if (data.requiresEmailConfirmation) {
        // Redirect to email verification page
        window.location.href = "/auth/verify-email";
      } else {
        // Email confirmation disabled, redirect to login
        window.location.href = "/auth/login?registered=true";
      }
    } catch {
      setFormError("Connection error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer title="Create your account" description="Join 10x Quiz Stack to start creating and taking quizzes">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive">
            <AlertDescription className="text-destructive">{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={`bg-background text-foreground border-input focus:border-primary ${
              errors.email ? "border-destructive" : ""
            }`}
            disabled={isLoading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && <FormFieldError error={errors.email} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className={`bg-background text-foreground border-input focus:border-primary ${
              errors.password ? "border-destructive" : ""
            }`}
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && <FormFieldError error={errors.password} />}
          {formData.password && <PasswordStrengthIndicator password={formData.password} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground">
            Confirm Password
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
          {isLoading ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/auth/login" className="text-primary hover:text-primary/80 underline font-medium">
            Login
          </a>
        </p>
      </form>
    </AuthContainer>
  );
}
