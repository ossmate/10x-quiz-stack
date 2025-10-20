import { describe, expect, it } from "vitest";

import { uuidSchema } from "./uuid.schema.ts";

describe("uuidSchema", () => {
  describe("valid UUIDs", () => {
    it("should accept valid UUID v4 format", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";

      const result = uuidSchema.safeParse(validUuid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validUuid);
      }
    });

    it("should accept UUID with uppercase letters", () => {
      const validUuid = "123E4567-E89B-12D3-A456-426614174000";

      const result = uuidSchema.safeParse(validUuid);

      expect(result.success).toBe(true);
    });

    it("should accept UUID with mixed case", () => {
      const validUuid = "123e4567-E89b-12D3-a456-426614174000";

      const result = uuidSchema.safeParse(validUuid);

      expect(result.success).toBe(true);
    });

    it("should accept UUID with all zeros", () => {
      const validUuid = "00000000-0000-0000-0000-000000000000";

      const result = uuidSchema.safeParse(validUuid);

      expect(result.success).toBe(true);
    });

    it("should accept UUID with all f's", () => {
      const validUuid = "ffffffff-ffff-ffff-ffff-ffffffffffff";

      const result = uuidSchema.safeParse(validUuid);

      expect(result.success).toBe(true);
    });

    it("should accept multiple different valid UUIDs", () => {
      const validUuids = [
        "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      ];

      validUuids.forEach((uuid) => {
        const result = uuidSchema.safeParse(uuid);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("invalid UUIDs", () => {
    it("should reject UUID without hyphens", () => {
      const invalidUuid = "123e4567e89b12d3a456426614174000";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid UUID format");
      }
    });

    it("should reject UUID with wrong hyphen positions", () => {
      const invalidUuid = "123e4567-e89-b12d3-a456-426614174000";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid UUID format");
      }
    });

    it("should reject UUID with too many characters", () => {
      const invalidUuid = "123e4567-e89b-12d3-a456-4266141740001";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with too few characters", () => {
      const invalidUuid = "123e4567-e89b-12d3-a456-42661417400";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with invalid characters (special chars)", () => {
      const invalidUuid = "123e4567-e89b-12d3-a456-4266141740@#";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with spaces", () => {
      const invalidUuid = "123e4567 e89b 12d3 a456 426614174000";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const invalidUuid = "";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid UUID format");
      }
    });

    it("should reject random string", () => {
      const invalidUuid = "not-a-uuid-at-all";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid UUID format");
      }
    });

    it("should reject number", () => {
      const invalidInput = 123456;

      const result = uuidSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject object", () => {
      const invalidInput = { uuid: "123e4567-e89b-12d3-a456-426614174000" };

      const result = uuidSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = uuidSchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it("should reject undefined", () => {
      const result = uuidSchema.safeParse(undefined);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with extra hyphens", () => {
      const invalidUuid = "123e4567--e89b-12d3-a456-426614174000";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with missing segments", () => {
      const invalidUuid = "123e4567-e89b-12d3-426614174000";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should reject UUID with leading whitespace", () => {
      const invalidUuid = " 123e4567-e89b-12d3-a456-426614174000";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with trailing whitespace", () => {
      const invalidUuid = "123e4567-e89b-12d3-a456-426614174000 ";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with newline", () => {
      const invalidUuid = "123e4567-e89b-12d3-a456-426614174000\n";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject UUID in curly braces (Microsoft format)", () => {
      const invalidUuid = "{123e4567-e89b-12d3-a456-426614174000}";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with urn:uuid: prefix", () => {
      const invalidUuid = "urn:uuid:123e4567-e89b-12d3-a456-426614174000";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });
  });

  describe("error messages", () => {
    it("should provide helpful error message for invalid UUID", () => {
      const invalidUuid = "not-a-uuid";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid UUID format");
        expect(result.error.errors[0].path).toEqual([]);
      }
    });

    it("should include the custom error message", () => {
      const invalidUuid = "123";

      const result = uuidSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid UUID format");
      }
    });
  });

  describe("type inference", () => {
    it("should correctly infer string type from valid UUID", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = uuidSchema.safeParse(validUuid);

      if (result.success) {
        // This should be typed as string
        const parsed: string = result.data;
        expect(typeof parsed).toBe("string");
      }
    });
  });
});
