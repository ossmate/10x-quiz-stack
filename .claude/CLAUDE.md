# AI Rules for 10x Quiz Stack

Quiz application built with modern web technologies.

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui
- Supabase

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers
- `./src/assets` - static internal assets
- `./public` - public assets

When modifying the directory structure, always update this section.

## Coding Practices

### Guidelines for Clean Code

- Use feedback from linters to improve the code when making changes.
- Prioritize error handling and edge cases.
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.

## Context-Specific Documentation

For detailed guidelines on specific technologies and patterns, refer to:

- `.claude/docs/code-generation-rules.md` - **REQUIRED**: Code generation standards and linting rules
- `.claude/docs/tailwind-theming.md` - **CRITICAL**: Tailwind theme system and semantic color tokens
- `.claude/docs/tailwind-quick-reference.md` - Quick reference for Tailwind theme tokens
- `.claude/docs/astro.md` - Astro-specific guidelines and patterns
- `.claude/docs/react.md` - React best practices and hooks
- `.claude/docs/frontend.md` - Frontend styling and accessibility
- `.claude/docs/backend.md` - Backend and database guidelines
- `.claude/docs/supabase-init.md` - Supabase integration setup
- `.claude/docs/supabase-migrations.md` - Database migration guidelines
- `.claude/docs/shadcn-ui.md` - Shadcn/ui component usage
- `.claude/docs/vitest-unit-testing.md` - Vitest unit and integration testing guidelines
- `.claude/docs/playwright-e2e-testing.md` - Playwright end-to-end testing guidelines

**⚠️ Styling Rule**: NEVER use hardcoded colors (e.g., `bg-gray-50`, `text-blue-600`). Always use semantic tokens (e.g., `bg-background`, `text-foreground`, `bg-primary`). See tailwind-theming.md for details.
