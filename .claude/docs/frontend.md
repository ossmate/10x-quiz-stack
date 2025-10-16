# Frontend Guidelines

**Applies to**: `*.tsx`, `*.astro` files

## General Guidelines

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed

## Styling with Tailwind

**⚠️ CRITICAL: Always use semantic color tokens - Never hardcode colors!**

📖 **See detailed theming guide:** `.claude/docs/tailwind-theming.md`

### Color Token Rules

- ❌ **NEVER** use hardcoded colors: `bg-gray-50`, `text-blue-600`, `bg-white`, `text-gray-900`
- ✅ **ALWAYS** use semantic tokens: `bg-background`, `text-foreground`, `bg-primary`, `bg-card`
- Use semantic tokens to ensure automatic light/dark mode support
- All colors use OKLCH color space for perceptual uniformity

### Common Token Replacements

- `bg-white` → `bg-card` or `bg-background`
- `bg-gray-50` → `bg-muted`
- `text-gray-900` → `text-foreground`
- `text-gray-600` → `text-muted-foreground`
- `bg-blue-600` → `bg-primary`
- `text-blue-600` → `text-primary`
- `bg-red-50` → `bg-destructive/10`
- `border-gray-300` → `border-border`

### Tailwind Best Practices

- Use the @layer directive to organize styles into components, utilities, and base layers
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant (automatically handled via `<html class="dark">`)
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus-visible:, active:, etc.) for interactive elements
- Use opacity modifiers for subtle backgrounds: `bg-primary/10`, `bg-destructive/20`

## Accessibility (ARIA Best Practices)

- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set aria-expanded and aria-controls for expandable content like accordions and dropdowns
- Use aria-live regions with appropriate politeness settings for dynamic content updates
- Implement aria-hidden to hide decorative or duplicative content from screen readers
- Apply aria-label or aria-labelledby for elements without visible text labels
- Use aria-describedby to associate descriptive text with form inputs or complex elements
- Implement aria-current for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements
