import { useState } from "react";
import { loginSchema, type LoginInput } from "../../lib/validation/auth.schema";
import { AuthContainer } from "./AuthContainer";
import { FormFieldError } from "./FormFieldError";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [formError, setFormError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof LoginInput, value: string) => {
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
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: { path: (string | number)[]; message: string }[] };
        zodError.issues?.forEach((err) => {
          const field = err.path[0] as keyof LoginInput;
          fieldErrors[field] = err.message;
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          // Email not verified
          setFormError(
            "Please verify your email address before logging in. Check your inbox for the verification link."
          );
        } else if (data.details) {
          // Validation errors
          setErrors(data.details);
        } else {
          setFormError(data.message || "Invalid email or password");
        }
        return;
      }

      // Login successful - redirect to original page or home
      window.location.href = redirectTo || "/";
    } catch {
      setFormError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer title="Welcome back" description="Sign in to your account to continue">
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
        </div>

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="space-y-2 text-center text-sm">
          <a href="/auth/forgot-password" className="text-primary hover:text-primary/80 underline">
            Forgot password?
          </a>

          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/auth/register" className="text-primary hover:text-primary/80 underline font-medium">
              Register
            </a>
          </p>
        </div>
      </form>
    </AuthContainer>
  );
}
