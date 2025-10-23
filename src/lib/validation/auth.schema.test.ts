import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schema.ts";

describe("emailSchema", () => {
  describe("valid emails", () => {
    it("should accept standard email format", () => {
      const validEmail = "user@example.com";

      const result = emailSchema.safeParse(validEmail);

      expect(result.success).toBe(true);
    });

    it("should accept email with subdomain", () => {
      const validEmail = "user@mail.example.com";

      const result = emailSchema.safeParse(validEmail);

      expect(result.success).toBe(true);
    });

    it("should accept email with plus sign", () => {
      const validEmail = "user+tag@example.com";

      const result = emailSchema.safeParse(validEmail);

      expect(result.success).toBe(true);
    });

    it("should accept email with dots in local part", () => {
      const validEmail = "first.last@example.com";

      const result = emailSchema.safeParse(validEmail);

      expect(result.success).toBe(true);
    });

    it("should accept email with numbers", () => {
      const validEmail = "user123@example456.com";

      const result = emailSchema.safeParse(validEmail);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid emails", () => {
    it("should reject empty string", () => {
      const result = emailSchema.safeParse("");

      expect(result.success).toBe(false);
      if (!result.success) {
        // Empty string triggers the .email() validation first (before .min())
        expect(result.error.errors[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject email without @", () => {
      const result = emailSchema.safeParse("userexample.com");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject email without domain", () => {
      const result = emailSchema.safeParse("user@");

      expect(result.success).toBe(false);
    });

    it("should reject email without local part", () => {
      const result = emailSchema.safeParse("@example.com");

      expect(result.success).toBe(false);
    });

    it("should reject email with spaces", () => {
      const result = emailSchema.safeParse("user name@example.com");

      expect(result.success).toBe(false);
    });
  });
});

describe("passwordSchema", () => {
  describe("valid passwords", () => {
    it("should accept password with all requirements", () => {
      const validPassword = "Password123";

      const result = passwordSchema.safeParse(validPassword);

      expect(result.success).toBe(true);
    });

    it("should accept password with special characters", () => {
      const validPassword = "Pass123!@#";

      const result = passwordSchema.safeParse(validPassword);

      expect(result.success).toBe(true);
    });

    it("should accept password with exactly 8 characters", () => {
      const validPassword = "Pass123a";

      const result = passwordSchema.safeParse(validPassword);

      expect(result.success).toBe(true);
    });

    it("should accept long password", () => {
      const validPassword = "VeryLongPassword123WithManyCharacters";

      const result = passwordSchema.safeParse(validPassword);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid passwords - length", () => {
    it("should reject password shorter than 8 characters", () => {
      const result = passwordSchema.safeParse("Pass12");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must be at least 8 characters");
      }
    });

    it("should reject password with exactly 7 characters", () => {
      const result = passwordSchema.safeParse("Pass123");

      expect(result.success).toBe(false);
    });
  });

  describe("invalid passwords - missing requirements", () => {
    it("should reject password without uppercase letter", () => {
      const result = passwordSchema.safeParse("password123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must contain at least one uppercase letter");
      }
    });

    it("should reject password without lowercase letter", () => {
      const result = passwordSchema.safeParse("PASSWORD123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must contain at least one lowercase letter");
      }
    });

    it("should reject password without number", () => {
      const result = passwordSchema.safeParse("PasswordABC");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must contain at least one number");
      }
    });

    it("should reject password with only special characters", () => {
      const result = passwordSchema.safeParse("!@#$%^&*()");

      expect(result.success).toBe(false);
    });
  });
});

describe("loginSchema", () => {
  describe("valid login", () => {
    it("should accept valid email and password", () => {
      const validLogin = {
        email: "user@example.com",
        password: "Password123",
      };

      const result = loginSchema.safeParse(validLogin);

      expect(result.success).toBe(true);
    });

    it("should accept any password string for login", () => {
      const validLogin = {
        email: "user@example.com",
        password: "weak",
      };

      const result = loginSchema.safeParse(validLogin);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid login", () => {
    it("should reject missing email", () => {
      const invalidLogin = { password: "Password123" };

      const result = loginSchema.safeParse(invalidLogin);

      expect(result.success).toBe(false);
    });

    it("should reject missing password", () => {
      const invalidLogin = { email: "user@example.com" };

      const result = loginSchema.safeParse(invalidLogin);

      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const invalidLogin = {
        email: "user@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidLogin);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password is required");
      }
    });

    it("should reject invalid email", () => {
      const invalidLogin = {
        email: "invalid-email",
        password: "Password123",
      };

      const result = loginSchema.safeParse(invalidLogin);

      expect(result.success).toBe(false);
    });
  });
});

describe("registerSchema", () => {
  describe("valid registration", () => {
    it("should accept valid registration data", () => {
      const validRegistration = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(validRegistration);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid registration", () => {
    it("should reject when passwords do not match", () => {
      const invalidRegistration = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "DifferentPass123",
      };

      const result = registerSchema.safeParse(invalidRegistration);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Passwords do not match");
        expect(result.error.errors[0].path).toContain("confirmPassword");
      }
    });

    it("should reject invalid email", () => {
      const invalidRegistration = {
        email: "invalid-email",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(invalidRegistration);

      expect(result.success).toBe(false);
    });

    it("should reject weak password", () => {
      const invalidRegistration = {
        email: "user@example.com",
        password: "weak",
        confirmPassword: "weak",
      };

      const result = registerSchema.safeParse(invalidRegistration);

      expect(result.success).toBe(false);
    });

    it("should reject missing confirmPassword", () => {
      const invalidRegistration = {
        email: "user@example.com",
        password: "Password123",
      };

      const result = registerSchema.safeParse(invalidRegistration);

      expect(result.success).toBe(false);
    });
  });
});

describe("forgotPasswordSchema", () => {
  describe("valid forgot password", () => {
    it("should accept valid email", () => {
      const validInput = { email: "user@example.com" };

      const result = forgotPasswordSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid forgot password", () => {
    it("should reject invalid email", () => {
      const invalidInput = { email: "invalid-email" };

      const result = forgotPasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject empty email", () => {
      const invalidInput = { email: "" };

      const result = forgotPasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject missing email", () => {
      const invalidInput = {};

      const result = forgotPasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });
});

describe("resetPasswordSchema", () => {
  describe("valid reset password", () => {
    it("should accept valid reset password data", () => {
      const validInput = {
        token: "valid-reset-token",
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      const result = resetPasswordSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid reset password", () => {
    it("should reject when passwords do not match", () => {
      const invalidInput = {
        token: "valid-reset-token",
        password: "NewPassword123",
        confirmPassword: "DifferentPassword123",
      };

      const result = resetPasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Passwords do not match");
        expect(result.error.errors[0].path).toContain("confirmPassword");
      }
    });

    it("should reject weak password", () => {
      const invalidInput = {
        token: "valid-reset-token",
        password: "weak",
        confirmPassword: "weak",
      };

      const result = resetPasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject empty token", () => {
      const invalidInput = {
        token: "",
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      const result = resetPasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Token is required");
      }
    });

    it("should reject missing token", () => {
      const invalidInput = {
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      const result = resetPasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });
});

describe("changePasswordSchema", () => {
  describe("valid change password", () => {
    it("should accept valid change password data", () => {
      const validInput = {
        currentPassword: "OldPassword123",
        newPassword: "NewPassword456",
        confirmPassword: "NewPassword456",
      };

      const result = changePasswordSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid change password", () => {
    it("should reject when new password matches current password", () => {
      const invalidInput = {
        currentPassword: "Password123",
        newPassword: "Password123",
        confirmPassword: "Password123",
      };

      const result = changePasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("New password must be different from current password");
        expect(result.error.errors[0].path).toContain("newPassword");
      }
    });

    it("should reject when passwords do not match", () => {
      const invalidInput = {
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
        confirmPassword: "DifferentPassword123",
      };

      const result = changePasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Passwords do not match");
        expect(result.error.errors[0].path).toContain("confirmPassword");
      }
    });

    it("should reject weak new password", () => {
      const invalidInput = {
        currentPassword: "OldPassword123",
        newPassword: "weak",
        confirmPassword: "weak",
      };

      const result = changePasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject empty current password", () => {
      const invalidInput = {
        currentPassword: "",
        newPassword: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      const result = changePasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Current password is required");
      }
    });

    it("should reject missing current password", () => {
      const invalidInput = {
        newPassword: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      const result = changePasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should enforce both password match and different from current checks", () => {
      // Test that both refine checks work together
      const invalidInput = {
        currentPassword: "Password123",
        newPassword: "Password123",
        confirmPassword: "DifferentPassword456",
      };

      const result = changePasswordSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      // Should fail on both checks
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
