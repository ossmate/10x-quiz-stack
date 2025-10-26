import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../../lib/validation/auth.schema";
import { useForgotPassword } from "../../lib/mutations/useForgotPassword";
import { AuthContainer } from "./AuthContainer";
import { FormFieldError } from "./FormFieldError";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

export function ForgotPasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string>("");
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (formData: ForgotPasswordInput) => {
    setSuccessMessage("");

    try {
      const result = await forgotPasswordMutation.mutateAsync(formData);
      setSuccessMessage(result.message);
      reset();
      toast.success("Password reset email sent! Redirecting to login...");

      // Redirect to login page after showing success message
      setTimeout(() => {
        // eslint-disable-next-line react-compiler/react-compiler
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send password reset email";
      toast.error(errorMessage);
    }
  };

  return (
    <AuthContainer
      title="Forgot password?"
      description="Enter your email address and we'll send you a link to reset your password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {successMessage && (
          <Alert className="bg-primary/10 border-primary">
            <AlertDescription className="text-primary">{successMessage}</AlertDescription>
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
            {...register("email")}
            className={`bg-background text-foreground border-input focus:border-primary ${
              errors.email ? "border-destructive" : ""
            }`}
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && <FormFieldError error={errors.email.message} />}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
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
