import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordInput } from "../../lib/validation/auth.schema";
import { useChangePassword } from "../../lib/mutations/useChangePassword";
import { FormFieldError } from "./FormFieldError";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function ChangePasswordForm() {
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (formData: ChangePasswordInput) => {
    try {
      await changePasswordMutation.mutateAsync(formData);
      toast.success("Password changed successfully! Redirecting...");
      reset();
      setShowPasswordStrength(false);

      // Redirect to dashboard after showing success message
      setTimeout(() => {
        // eslint-disable-next-line react-compiler/react-compiler
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Password change failed";
      toast.error(errorMessage);
    }
  };

  const handlePasswordFocus = () => {
    setShowPasswordStrength(true);
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-foreground">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                {...register("currentPassword")}
                className={`bg-background text-foreground border-input focus:border-primary ${
                  errors.currentPassword ? "border-destructive" : ""
                }`}
                disabled={isSubmitting}
                aria-invalid={!!errors.currentPassword}
                aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
              />
              {errors.currentPassword && <FormFieldError error={errors.currentPassword.message} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                {...register("newPassword")}
                onFocus={handlePasswordFocus}
                className={`bg-background text-foreground border-input focus:border-primary ${
                  errors.newPassword ? "border-destructive" : ""
                }`}
                disabled={isSubmitting}
                aria-invalid={!!errors.newPassword}
                aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
              />
              {errors.newPassword && <FormFieldError error={errors.newPassword.message} />}
              {showPasswordStrength && <PasswordStrengthIndicator password={newPassword} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={`bg-background text-foreground border-input focus:border-primary ${
                  errors.confirmPassword ? "border-destructive" : ""
                }`}
                disabled={isSubmitting}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword && <FormFieldError error={errors.confirmPassword.message} />}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Changing password..." : "Change password"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
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
