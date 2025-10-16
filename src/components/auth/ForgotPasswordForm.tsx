import { useState } from "react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../../lib/validation/auth.schema";
import { AuthContainer } from "./AuthContainer";
import { FormFieldError } from "./FormFieldError";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordInput>({
    email: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ForgotPasswordInput, string>>>({});
  const [formError, setFormError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof ForgotPasswordInput, value: string) => {
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
      forgotPasswordSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      const fieldErrors: Partial<Record<keyof ForgotPasswordInput, string>> = {};
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: { path: (string | number)[]; message: string }[] };
        zodError.issues?.forEach((err) => {
          const field = err.path[0] as keyof ForgotPasswordInput;
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
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch("/api/auth/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   setFormError(error.message || "Request failed. Please try again.");
      //   return;
      // }

      // Always show success message for security (don't reveal if email exists)
      setSuccessMessage("If an account exists with this email, you will receive a password reset link shortly.");
      setFormData({ email: "" });
    } catch {
      setFormError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer
      title="Forgot password?"
      description="Enter your email address and we'll send you a link to reset your password"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive">
            <AlertDescription className="text-destructive">{formError}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="bg-[oklch(0.65_0.15_145)]/10 border-[oklch(0.65_0.15_145)]">
            <AlertDescription className="text-[oklch(0.65_0.15_145)]">{successMessage}</AlertDescription>
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

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send reset link"}
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
