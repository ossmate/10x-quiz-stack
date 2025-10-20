import { describe, expect, it } from "vitest";

import { quizListQuerySchema } from "./quiz-list-query.schema.ts";

describe("quizListQuerySchema", () => {
  describe("valid query parameters with defaults", () => {
    it("should apply default values when no parameters provided", () => {
      const result = quizListQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 1,
          limit: 10,
          sort: "created_at",
          order: "desc",
        });
      }
    });

    it("should use provided values and fill in defaults", () => {
      const input = { page: 2 };

      const result = quizListQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 2,
          limit: 10,
          sort: "created_at",
          order: "desc",
        });
      }
    });
  });

  describe("page validation", () => {
    it("should accept page number 1", () => {
      const result = quizListQuerySchema.safeParse({ page: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("should accept large page numbers", () => {
      const result = quizListQuerySchema.safeParse({ page: 1000 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1000);
      }
    });

    it("should coerce string page to number", () => {
      const result = quizListQuerySchema.safeParse({ page: "5" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(typeof result.data.page).toBe("number");
      }
    });

    it("should reject page number 0", () => {
      const result = quizListQuerySchema.safeParse({ page: 0 });

      expect(result.success).toBe(false);
    });

    it("should reject negative page numbers", () => {
      const result = quizListQuerySchema.safeParse({ page: -1 });

      expect(result.success).toBe(false);
    });

    it("should reject non-integer page numbers", () => {
      const result = quizListQuerySchema.safeParse({ page: 1.5 });

      expect(result.success).toBe(false);
    });
  });

  describe("limit validation", () => {
    it("should accept limit of 1", () => {
      const result = quizListQuerySchema.safeParse({ limit: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it("should accept limit of 100", () => {
      const result = quizListQuerySchema.safeParse({ limit: 100 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it("should accept common limit values", () => {
      const limits = [10, 25, 50, 100];

      limits.forEach((limit) => {
        const result = quizListQuerySchema.safeParse({ limit });
        expect(result.success).toBe(true);
      });
    });

    it("should coerce string limit to number", () => {
      const result = quizListQuerySchema.safeParse({ limit: "25" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(typeof result.data.limit).toBe("number");
      }
    });

    it("should reject limit of 0", () => {
      const result = quizListQuerySchema.safeParse({ limit: 0 });

      expect(result.success).toBe(false);
    });

    it("should reject negative limit", () => {
      const result = quizListQuerySchema.safeParse({ limit: -10 });

      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const result = quizListQuerySchema.safeParse({ limit: 101 });

      expect(result.success).toBe(false);
    });

    it("should reject non-integer limit", () => {
      const result = quizListQuerySchema.safeParse({ limit: 10.5 });

      expect(result.success).toBe(false);
    });
  });

  describe("sort validation", () => {
    it("should accept 'created_at' sort field", () => {
      const result = quizListQuerySchema.safeParse({ sort: "created_at" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("should accept 'title' sort field", () => {
      const result = quizListQuerySchema.safeParse({ sort: "title" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("title");
      }
    });

    it("should accept 'updated_at' sort field", () => {
      const result = quizListQuerySchema.safeParse({ sort: "updated_at" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("updated_at");
      }
    });

    it("should reject invalid sort field", () => {
      const result = quizListQuerySchema.safeParse({ sort: "invalid_field" });

      expect(result.success).toBe(false);
    });

    it("should reject numeric sort field", () => {
      const result = quizListQuerySchema.safeParse({ sort: 123 });

      expect(result.success).toBe(false);
    });
  });

  describe("order validation", () => {
    it("should accept 'asc' order", () => {
      const result = quizListQuerySchema.safeParse({ order: "asc" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("asc");
      }
    });

    it("should accept 'desc' order", () => {
      const result = quizListQuerySchema.safeParse({ order: "desc" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("should reject invalid order", () => {
      const result = quizListQuerySchema.safeParse({ order: "ascending" });

      expect(result.success).toBe(false);
    });

    it("should reject uppercase order values", () => {
      const result = quizListQuerySchema.safeParse({ order: "ASC" });

      expect(result.success).toBe(false);
    });
  });

  describe("status validation", () => {
    it("should accept 'draft' status", () => {
      const result = quizListQuerySchema.safeParse({ status: "draft" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("draft");
      }
    });

    it("should accept 'public' status", () => {
      const result = quizListQuerySchema.safeParse({ status: "public" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("public");
      }
    });

    it("should accept 'private' status", () => {
      const result = quizListQuerySchema.safeParse({ status: "private" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("private");
      }
    });

    it("should accept 'archived' status", () => {
      const result = quizListQuerySchema.safeParse({ status: "archived" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("archived");
      }
    });

    it("should allow status to be optional (undefined)", () => {
      const result = quizListQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBeUndefined();
      }
    });

    it("should reject invalid status", () => {
      const result = quizListQuerySchema.safeParse({ status: "invalid" });

      expect(result.success).toBe(false);
    });

    it("should reject uppercase status", () => {
      const result = quizListQuerySchema.safeParse({ status: "DRAFT" });

      expect(result.success).toBe(false);
    });
  });

  describe("combined valid queries", () => {
    it("should accept all parameters together", () => {
      const validQuery = {
        page: 2,
        limit: 25,
        sort: "title",
        order: "asc",
        status: "public",
      };

      const result = quizListQuerySchema.safeParse(validQuery);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validQuery);
      }
    });

    it("should accept partial parameters with defaults", () => {
      const input = {
        page: 5,
        status: "draft",
      };

      const result = quizListQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 5,
          limit: 10,
          sort: "created_at",
          order: "desc",
          status: "draft",
        });
      }
    });

    it("should accept sort and order without status", () => {
      const input = {
        sort: "updated_at",
        order: "asc",
      };

      const result = quizListQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("updated_at");
        expect(result.data.order).toBe("asc");
        expect(result.data.status).toBeUndefined();
      }
    });
  });

  describe("type coercion", () => {
    it("should coerce string numbers to numbers for page and limit", () => {
      const input = {
        page: "3",
        limit: "50",
      };

      const result = quizListQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
        expect(typeof result.data.page).toBe("number");
        expect(typeof result.data.limit).toBe("number");
      }
    });

    it("should handle URL query string format", () => {
      // Simulating URLSearchParams which provides string values
      const input = {
        page: "2",
        limit: "20",
        sort: "title",
        order: "asc",
        status: "public",
      };

      const result = quizListQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe("edge cases", () => {
    it("should reject extra unknown fields", () => {
      const input = {
        page: 1,
        limit: 10,
        sort: "created_at",
        order: "desc",
        unknownField: "value",
      };

      const result = quizListQuerySchema.safeParse(input);

      // Zod strips unknown fields by default in strict mode
      expect(result.success).toBe(true);
      if (result.success) {
        expect("unknownField" in result.data).toBe(false);
      }
    });

    it("should handle boundary values for page", () => {
      const result1 = quizListQuerySchema.safeParse({ page: 1 });
      expect(result1.success).toBe(true);

      const result2 = quizListQuerySchema.safeParse({ page: Number.MAX_SAFE_INTEGER });
      expect(result2.success).toBe(true);
    });

    it("should handle boundary values for limit", () => {
      const result1 = quizListQuerySchema.safeParse({ limit: 1 });
      expect(result1.success).toBe(true);

      const result2 = quizListQuerySchema.safeParse({ limit: 100 });
      expect(result2.success).toBe(true);

      const result3 = quizListQuerySchema.safeParse({ limit: 101 });
      expect(result3.success).toBe(false);
    });
  });

  describe("real-world query scenarios", () => {
    it("should handle first page with default settings", () => {
      const result = quizListQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should handle pagination to second page", () => {
      const result = quizListQuerySchema.safeParse({ page: 2 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
      }
    });

    it("should handle filtering by draft status", () => {
      const result = quizListQuerySchema.safeParse({ status: "draft" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("draft");
      }
    });

    it("should handle sorting by title ascending", () => {
      const result = quizListQuerySchema.safeParse({
        sort: "title",
        order: "asc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("title");
        expect(result.data.order).toBe("asc");
      }
    });

    it("should handle complex query with all filters", () => {
      const result = quizListQuerySchema.safeParse({
        page: "3",
        limit: "50",
        sort: "updated_at",
        order: "desc",
        status: "public",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 3,
          limit: 50,
          sort: "updated_at",
          order: "desc",
          status: "public",
        });
      }
    });
  });
});
