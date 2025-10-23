import { describe, expect, it } from "vitest";

import { formatDate, formatDistanceToNow } from "./date.ts";

describe("formatDistanceToNow", () => {
  describe("recent times", () => {
    it("should return 'just now' for times less than 60 seconds ago", () => {
      const now = new Date();
      const fiveSecondsAgo = new Date(now.getTime() - 5 * 1000);

      expect(formatDistanceToNow(fiveSecondsAgo)).toBe("just now");
    });

    it("should return 'just now' for current time", () => {
      const now = new Date();

      expect(formatDistanceToNow(now)).toBe("just now");
    });

    it("should return 'just now' for 59 seconds ago", () => {
      const now = new Date();
      const fiftyNineSecondsAgo = new Date(now.getTime() - 59 * 1000);

      expect(formatDistanceToNow(fiftyNineSecondsAgo)).toBe("just now");
    });
  });

  describe("minutes", () => {
    it("should return '1 minute ago' for exactly 1 minute", () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      expect(formatDistanceToNow(oneMinuteAgo)).toBe("1 minute ago");
    });

    it("should return '5 minutes ago' for 5 minutes", () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      expect(formatDistanceToNow(fiveMinutesAgo)).toBe("5 minutes ago");
    });

    it("should return '59 minutes ago' for 59 minutes", () => {
      const now = new Date();
      const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60 * 1000);

      expect(formatDistanceToNow(fiftyNineMinutesAgo)).toBe("59 minutes ago");
    });

    it("should handle plural correctly for singular minute", () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      expect(formatDistanceToNow(oneMinuteAgo)).not.toContain("minutes");
      expect(formatDistanceToNow(oneMinuteAgo)).toContain("minute");
    });
  });

  describe("hours", () => {
    it("should return '1 hour ago' for exactly 1 hour", () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(formatDistanceToNow(oneHourAgo)).toBe("1 hour ago");
    });

    it("should return '12 hours ago' for 12 hours", () => {
      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

      expect(formatDistanceToNow(twelveHoursAgo)).toBe("12 hours ago");
    });

    it("should return '23 hours ago' for 23 hours", () => {
      const now = new Date();
      const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);

      expect(formatDistanceToNow(twentyThreeHoursAgo)).toBe("23 hours ago");
    });

    it("should handle plural correctly for singular hour", () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(formatDistanceToNow(oneHourAgo)).not.toContain("hours");
      expect(formatDistanceToNow(oneHourAgo)).toContain("hour");
    });
  });

  describe("days", () => {
    it("should return '1 day ago' for exactly 1 day", () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(oneDayAgo)).toBe("1 day ago");
    });

    it("should return '7 days ago' for 1 week", () => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(oneWeekAgo)).toBe("7 days ago");
    });

    it("should return '29 days ago' for 29 days", () => {
      const now = new Date();
      const twentyNineDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(twentyNineDaysAgo)).toBe("29 days ago");
    });

    it("should handle plural correctly for singular day", () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(oneDayAgo)).not.toContain("days");
      expect(formatDistanceToNow(oneDayAgo)).toContain("day");
    });
  });

  describe("months", () => {
    it("should return '1 month ago' for exactly 30 days", () => {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(oneMonthAgo)).toBe("1 month ago");
    });

    it("should return '6 months ago' for 6 months", () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(sixMonthsAgo)).toBe("6 months ago");
    });

    it("should return '11 months ago' for 11 months", () => {
      const now = new Date();
      const elevenMonthsAgo = new Date(now.getTime() - 11 * 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(elevenMonthsAgo)).toBe("11 months ago");
    });

    it("should handle plural correctly for singular month", () => {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(oneMonthAgo)).not.toContain("months");
      expect(formatDistanceToNow(oneMonthAgo)).toContain("month");
    });
  });

  describe("years", () => {
    it("should return '1 year ago' for exactly 1 year (12 months)", () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(oneYearAgo)).toBe("1 year ago");
    });

    it("should return '2 years ago' for 2 years", () => {
      const now = new Date();
      const twoYearsAgo = new Date(now.getTime() - 24 * 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(twoYearsAgo)).toBe("2 years ago");
    });

    it("should return '5 years ago' for 5 years", () => {
      const now = new Date();
      const fiveYearsAgo = new Date(now.getTime() - 60 * 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(fiveYearsAgo)).toBe("5 years ago");
    });

    it("should handle plural correctly for singular year", () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(oneYearAgo)).not.toContain("years");
      expect(formatDistanceToNow(oneYearAgo)).toContain("year");
    });
  });

  describe("edge cases", () => {
    it("should handle future dates (negative time difference)", () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 60 * 1000);

      // Future dates result in negative differences, which should be handled gracefully
      // The implementation doesn't explicitly handle future dates, so we document current behavior
      const result = formatDistanceToNow(futureDate);
      expect(result).toBe("just now");
    });

    it("should handle very old dates", () => {
      const veryOldDate = new Date("1990-01-01");
      const result = formatDistanceToNow(veryOldDate);

      // Should return years for very old dates
      expect(result).toMatch(/\d+ years? ago/);
    });

    it("should handle date at epoch (1970-01-01)", () => {
      const epochDate = new Date(0);
      const result = formatDistanceToNow(epochDate);

      // Should return years for dates at epoch
      expect(result).toMatch(/\d+ years? ago/);
    });
  });

  describe("boundary conditions", () => {
    it("should correctly handle 60 seconds boundary (should be 1 minute, not just now)", () => {
      const now = new Date();
      const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);

      expect(formatDistanceToNow(sixtySecondsAgo)).toBe("1 minute ago");
    });

    it("should correctly handle 60 minutes boundary (should be 1 hour, not minutes)", () => {
      const now = new Date();
      const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(formatDistanceToNow(sixtyMinutesAgo)).toBe("1 hour ago");
    });

    it("should correctly handle 24 hours boundary (should be 1 day, not hours)", () => {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(twentyFourHoursAgo)).toBe("1 day ago");
    });

    it("should correctly handle 30 days boundary (should be 1 month, not days)", () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(thirtyDaysAgo)).toBe("1 month ago");
    });

    it("should correctly handle 12 months boundary (should be 1 year, not months)", () => {
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);

      expect(formatDistanceToNow(twelveMonthsAgo)).toBe("1 year ago");
    });
  });
});

describe("formatDate", () => {
  describe("valid date formatting", () => {
    it("should format ISO date string correctly", () => {
      const dateString = "2025-01-15T10:30:00Z";
      const result = formatDate(dateString);

      expect(result).toBe("Jan 15, 2025");
    });

    it("should format date without time correctly", () => {
      const dateString = "2025-12-25";
      const result = formatDate(dateString);

      expect(result).toMatch(/Dec 2[45], 2025/); // Account for timezone differences
    });

    it("should format date with different month correctly", () => {
      const dateString = "2024-03-08T00:00:00Z";
      const result = formatDate(dateString);

      expect(result).toMatch(/Mar [78], 2024/); // Account for timezone differences
    });

    it("should use short month names", () => {
      const testCases = [
        { date: "2025-01-01", month: "Jan" },
        { date: "2025-02-01", month: "Feb" },
        { date: "2025-03-01", month: "Mar" },
        { date: "2025-04-01", month: "Apr" },
        { date: "2025-05-01", month: "May" },
        { date: "2025-06-01", month: "Jun" },
        { date: "2025-07-01", month: "Jul" },
        { date: "2025-08-01", month: "Aug" },
        { date: "2025-09-01", month: "Sep" },
        { date: "2025-10-01", month: "Oct" },
        { date: "2025-11-01", month: "Nov" },
        { date: "2025-12-01", month: "Dec" },
      ];

      testCases.forEach(({ date, month }) => {
        expect(formatDate(date)).toContain(month);
      });
    });

    it("should format year with 4 digits", () => {
      const dateString = "2025-06-15T10:30:00Z";
      const result = formatDate(dateString);

      expect(result).toContain("2025");
      expect(result).toMatch(/\d{4}/); // Contains 4-digit year
    });

    it("should handle dates from different years", () => {
      expect(formatDate("2020-01-01")).toMatch(/Jan \d+, 2020/);
      expect(formatDate("2023-06-15")).toMatch(/Jun 1[45], 2023/);
      expect(formatDate("2025-12-31")).toMatch(/Dec 3[01], 2025/);
    });
  });

  describe("edge cases", () => {
    it("should handle date at start of year", () => {
      const dateString = "2025-01-01T00:00:00Z";
      const result = formatDate(dateString);

      expect(result).toMatch(/Jan \d+, 2025/);
    });

    it("should handle date at end of year", () => {
      const dateString = "2025-12-31T12:00:00Z";
      const result = formatDate(dateString);

      // Use noon to avoid timezone edge cases
      expect(result).toBe("Dec 31, 2025");
    });

    it("should handle leap year date", () => {
      const dateString = "2024-02-29T12:00:00Z";
      const result = formatDate(dateString);

      // Use noon to avoid timezone edge cases
      expect(result).toBe("Feb 29, 2024");
    });

    it("should handle date at epoch", () => {
      const dateString = "1970-01-01T00:00:00Z";
      const result = formatDate(dateString);

      expect(result).toMatch(/Jan \d+, 1970/);
    });

    it("should handle very old dates", () => {
      const dateString = "1900-01-01T00:00:00Z";
      const result = formatDate(dateString);

      expect(result).toMatch(/Jan \d+, 1900/);
    });

    it("should handle far future dates", () => {
      const dateString = "2100-12-31T12:00:00Z";
      const result = formatDate(dateString);

      // Use noon to avoid timezone edge cases
      expect(result).toBe("Dec 31, 2100");
    });
  });

  describe("invalid date handling", () => {
    it("should handle invalid date string gracefully", () => {
      const invalidDate = "not-a-date";

      // The function will create an Invalid Date, which toLocaleDateString handles
      expect(() => formatDate(invalidDate)).not.toThrow();
    });

    it("should handle empty string", () => {
      const emptyString = "";

      // Empty string creates invalid date but doesn't throw
      expect(() => formatDate(emptyString)).not.toThrow();
    });

    it("should handle malformed ISO string", () => {
      const malformedDate = "2025-13-45"; // Invalid month and day

      // Malformed dates are handled by Date constructor
      expect(() => formatDate(malformedDate)).not.toThrow();
    });
  });

  describe("timezone handling", () => {
    it("should format date consistently regardless of timezone", () => {
      // Using UTC time to ensure consistency
      const dateString = "2025-06-15T12:00:00Z";
      const result = formatDate(dateString);

      expect(result).toMatch(/Jun 1[45], 2025/); // May vary by 1 day due to timezone
    });

    it("should handle date string with timezone offset", () => {
      const dateWithTimezone = "2025-06-15T10:30:00+05:30";
      const result = formatDate(dateWithTimezone);

      expect(result).toMatch(/Jun 1[45], 2025/);
    });
  });

  describe("format consistency", () => {
    it("should use en-US locale format", () => {
      const dateString = "2025-06-15T10:30:00Z";
      const result = formatDate(dateString);

      // en-US format: "Mon DD, YYYY"
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    });

    it("should not include time in output", () => {
      const dateString = "2025-06-15T14:30:45.123Z";
      const result = formatDate(dateString);

      expect(result).not.toMatch(/\d{2}:\d{2}/); // Should not contain time
      expect(result).not.toContain(":");
    });

    it("should not include day of week", () => {
      const dateString = "2025-06-15T10:30:00Z";
      const result = formatDate(dateString);

      // Should not contain day names
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const containsDayName = dayNames.some((day) => result.includes(day));
      expect(containsDayName).toBe(false);
    });
  });
});
