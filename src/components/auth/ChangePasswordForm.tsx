import { useState } from "react";
import { changePasswordSchema, type ChangePasswordInput } from "../../lib/validation/auth.schema";
import { FormFieldError } from "./FormFieldError";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function ChangePasswordForm() {
  const [formData, setFormData] = useState<ChangePasswordInput>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordInput, string>>>({});
  const [formError, setFormError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const handleInputChange = (field: keyof ChangePasswordInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) {
      setFormError("");
    }
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handlePasswordFocus = () => {
    setShowPasswordStrength(true);
  };

  const validateForm = (): boolean => {
    try {
      changePasswordSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      const fieldErrors: Partial<Record<keyof ChangePasswordInput, string>> = {};
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: { path: (string | number)[]; message: string }[] };
        zodError.issues?.forEach((err) => {
          const field = err.path[0] as keyof ChangePasswordInput;
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
      // const response = await fetch("/api/auth/change-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     currentPassword: formData.currentPassword,
      //     newPassword: formData.newPassword,
      //   }),
      // });
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   setFormError(error.message || "Password change failed");
      //   return;
      // }

      // Success - show message and reset form
      setSuccessMessage("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordStrength(false);
    } catch {
      setFormError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Change Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="currentPassword" className="text-foreground">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={formData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                className={`bg-background text-foreground border-input focus:border-primary ${
                  errors.currentPassword ? "border-destructive" : ""
                }`}
                disabled={isLoading}
                aria-invalid={!!errors.currentPassword}
                aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
              />
              {errors.currentPassword && <FormFieldError error={errors.currentPassword} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                onFocus={handlePasswordFocus}
                className={`bg-background text-foreground border-input focus:border-primary ${
                  errors.newPassword ? "border-destructive" : ""
                }`}
                disabled={isLoading}
                aria-invalid={!!errors.newPassword}
                aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
              />
              {errors.newPassword && <FormFieldError error={errors.newPassword} />}
              {showPasswordStrength && <PasswordStrengthIndicator password={formData.newPassword} />}
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

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Changing password..." : "Change password"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
                onClick={() => window.history.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
