import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Security test to ensure Row-Level Security (RLS) is enforced
 * by preventing service-role key usage in HTTP route handlers
 */
describe("RLS Enforcement", () => {
  it("should not use SUPABASE_SERVICE_ROLE_KEY in middleware", () => {
    const middlewarePath = join(__dirname, "../../middleware/index.ts");
    const content = readFileSync(middlewarePath, "utf-8");

    expect(content).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(content).not.toContain("serviceRoleKey");
  });

  it("should not use SUPABASE_SERVICE_ROLE_KEY in API routes", () => {
    const apiRoutesPath = join(__dirname, "../../pages/api");

    function checkDirectory(dir: string): void {
      const files = readdirSync(dir);

      for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          checkDirectory(fullPath);
        } else if (file.endsWith(".ts")) {
          const content = readFileSync(fullPath, "utf-8");

          expect(content, `File ${fullPath} should not contain SUPABASE_SERVICE_ROLE_KEY`).not.toContain(
            "SUPABASE_SERVICE_ROLE_KEY"
          );

          expect(content, `File ${fullPath} should not contain serviceRoleKey`).not.toContain("serviceRoleKey");
        }
      }
    }

    checkDirectory(apiRoutesPath);
  });

  it("should not create Supabase client with service role in routes", () => {
    const apiRoutesPath = join(__dirname, "../../pages/api");

    function checkDirectory(dir: string): void {
      const files = readdirSync(dir);

      for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          checkDirectory(fullPath);
        } else if (file.endsWith(".ts")) {
          const content = readFileSync(fullPath, "utf-8");

          // Check for direct createClient calls (should use locals.supabase instead)
          const hasCreateClient = /createClient\s*<.*>\s*\(/g.test(content);
          const hasImportCreateClient = /import.*createClient.*from.*supabase-js/.test(content);

          if (hasCreateClient || hasImportCreateClient) {
            // If they import createClient from supabase-js (not from our client wrapper),
            // it's likely creating a service-role client
            expect(
              hasImportCreateClient,
              `File ${fullPath} should not import createClient from @supabase/supabase-js. Use locals.supabase instead.`
            ).toBe(false);
          }
        }
      }
    }

    checkDirectory(apiRoutesPath);
  });

  it("should use locals.supabase in all API route handlers", () => {
    const apiRoutesPath = join(__dirname, "../../pages/api");
    const routesChecked: string[] = [];
    const routesMissingLocals: string[] = [];

    function checkDirectory(dir: string): void {
      const files = readdirSync(dir);

      for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          checkDirectory(fullPath);
        } else if (file.endsWith(".ts")) {
          const content = readFileSync(fullPath, "utf-8");

          // Check if file defines API route handlers
          const hasApiRoute = /export\s+const\s+(GET|POST|PUT|DELETE|PATCH):\s*APIRoute/.test(content);

          if (hasApiRoute) {
            routesChecked.push(fullPath);

            // Check if it uses locals.supabase
            const usesLocals = /locals\.supabase/.test(content);

            if (!usesLocals) {
              routesMissingLocals.push(fullPath);
            }
          }
        }
      }
    }

    checkDirectory(apiRoutesPath);

    // Ensure we found some routes to check
    expect(routesChecked.length, "Should have found API routes to check").toBeGreaterThan(0);

    // All routes should use locals.supabase
    expect(
      routesMissingLocals,
      `The following routes don't use locals.supabase:\n${routesMissingLocals.join("\n")}`
    ).toHaveLength(0);
  });
});
