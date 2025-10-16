# Tailwind Theming Guide for 10x Quiz Stack

## Overview

This project uses **Tailwind CSS 4** with a comprehensive theming system based on CSS custom properties and the OKLCH color space. The theme supports both light and dark modes with semantic color tokens.

## Theme Architecture

### Color System

We use **OKLCH color space** for better perceptual uniformity and color manipulation. All colors are defined as CSS custom properties in `src/styles/global.css`.

### Theme Modes

- **Light Mode (Primary)**: Default mode, defined in `:root`
- **Dark Mode**: Activated by adding `class="dark"` to the `<html>` element

## Semantic Color Tokens

**NEVER use hardcoded colors like `bg-gray-50`, `text-blue-600`, `bg-white`, etc.**

Instead, use these semantic tokens that automatically adapt to light/dark mode:

### Background & Foreground

```tsx
// ❌ WRONG
className="bg-white text-gray-900"

// ✅ CORRECT
className="bg-background text-foreground"
```

- `bg-background` / `text-foreground` - Base page background and text
- `bg-card` / `text-card-foreground` - Card/panel background and text
- `bg-popover` / `text-popover-foreground` - Popup/dropdown background and text

### Interactive Elements

```tsx
// ❌ WRONG
className="bg-blue-600 text-white hover:bg-blue-700"

// ✅ CORRECT
className="bg-primary text-primary-foreground hover:bg-primary/90"
```

- `bg-primary` / `text-primary-foreground` - Primary actions (buttons, links)
- `bg-secondary` / `text-secondary-foreground` - Secondary actions
- `bg-accent` / `text-accent-foreground` - Accent elements, hover states
- `bg-muted` / `text-muted-foreground` - Subdued backgrounds and labels

### Status & Feedback

```tsx
// ❌ WRONG
className="bg-red-50 border-red-300 text-red-700"

// ✅ CORRECT
className="bg-destructive/10 border-destructive text-destructive"
```

- `bg-destructive` / `text-destructive` / `border-destructive` - Errors, delete actions
- Use opacity modifiers for lighter backgrounds: `bg-destructive/10`, `bg-primary/20`

### Borders & Inputs

```tsx
// ❌ WRONG
className="border-gray-300 focus:border-blue-500"

// ✅ CORRECT
className="border-border focus:border-primary"
```

- `border-border` - Default borders
- `border-input` - Input field borders
- `ring-ring` - Focus ring color

### Text Colors

```tsx
// ❌ WRONG
<h1 className="text-gray-900">Title</h1>
<p className="text-gray-600">Description</p>
<span className="text-gray-400">Label</span>

// ✅ CORRECT
<h1 className="text-foreground">Title</h1>
<p className="text-muted-foreground">Description</p>
<span className="text-muted-foreground">Label</span>
```

### Charts & Data Visualization

- `bg-chart-1` through `bg-chart-5` - Chart colors that adapt to theme

### Sidebar (if applicable)

- `bg-sidebar` / `text-sidebar-foreground`
- `bg-sidebar-primary` / `text-sidebar-primary-foreground`
- `bg-sidebar-accent` / `text-sidebar-accent-foreground`

## Border Radius

Use semantic radius tokens instead of hardcoded values:

```tsx
// ❌ WRONG
className="rounded-lg"

// ✅ CORRECT (though rounded-lg works via theme mapping)
className="rounded-lg" // Maps to var(--radius)
```

Available radius utilities (all mapped to CSS variables):
- `rounded-sm` - Small radius
- `rounded-md` - Medium radius
- `rounded-lg` - Large radius (default)
- `rounded-xl` - Extra large radius

## Shadow System

Use semantic shadow utilities:

```tsx
className="shadow-sm"  // Small shadow
className="shadow"     // Default shadow
className="shadow-md"  // Medium shadow
className="shadow-lg"  // Large shadow
className="shadow-xl"  // Extra large shadow
```

All shadows are theme-aware and defined in CSS variables.

## Common Patterns

### Button Styles

```tsx
// Primary Button
<button className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring">
  Click Me
</button>

// Secondary Button
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
  Cancel
</button>

// Destructive Button
<button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete
</button>

// Ghost/Subtle Button
<button className="bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground">
  Link
</button>
```

### Card Styles

```tsx
<div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
  <h2 className="text-foreground font-bold">Card Title</h2>
  <p className="text-muted-foreground">Card description</p>
</div>
```

### Form Inputs

```tsx
<input
  className="bg-background text-foreground border-input focus:border-primary focus:ring-primary"
  placeholder="Enter text..."
/>

<label className="text-sm font-medium text-foreground">
  Field Label
</label>

<span className="text-sm text-muted-foreground">
  Helper text or description
</span>
```

### Error States

```tsx
// Error Message
<div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-4">
  <p>Error message here</p>
</div>

// Error Input
<input className="border-destructive focus:ring-destructive" />

// Error Text
<span className="text-destructive text-sm">Invalid input</span>
```

### Navigation

```tsx
// Active Link
<a className="text-foreground border-b-2 border-primary">
  Active
</a>

// Inactive Link
<a className="text-muted-foreground hover:text-foreground hover:border-border">
  Inactive
</a>
```

## Migration Checklist

When updating existing components, replace:

- ❌ `bg-white` → ✅ `bg-card` or `bg-background`
- ❌ `bg-gray-50` → ✅ `bg-muted`
- ❌ `bg-gray-100` → ✅ `bg-accent`
- ❌ `text-gray-900` → ✅ `text-foreground`
- ❌ `text-gray-700` → ✅ `text-foreground`
- ❌ `text-gray-600` → ✅ `text-muted-foreground`
- ❌ `text-gray-500` → ✅ `text-muted-foreground`
- ❌ `text-gray-400` → ✅ `text-muted-foreground`
- ❌ `bg-blue-600` → ✅ `bg-primary`
- ❌ `text-blue-600` → ✅ `text-primary`
- ❌ `hover:bg-blue-700` → ✅ `hover:bg-primary/90`
- ❌ `bg-red-50` → ✅ `bg-destructive/10`
- ❌ `text-red-600` → ✅ `text-destructive`
- ❌ `border-gray-300` → ✅ `border-border`
- ❌ `border-red-300` → ✅ `border-destructive`
- ❌ `ring-blue-500` → ✅ `ring-ring` or `ring-primary`

## Dark Mode Toggle (Future Implementation)

To implement a dark mode toggle:

```tsx
// Example toggle component
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  
  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
    }
    setIsDark(!isDark);
  };
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
```

## Current Theme Configuration

The theme is currently set to **dark mode by default** in both layout files:
- `src/layouts/Layout.astro` - `<html class="dark">`
- `src/layouts/ManagementLayout.astro` - `<html class="dark">`

To switch to light mode, remove the `dark` class from the HTML element.

## Resources

- Tailwind CSS 4 Documentation: https://tailwindcss.com/
- OKLCH Color Space: https://oklch.com/
- Color System defined in: `src/styles/global.css`

## Best Practices

1. **Always use semantic tokens** - Never hardcode colors
2. **Test in both modes** - Ensure components work in light and dark themes
3. **Use opacity modifiers** - For subtle backgrounds (`bg-primary/10`)
4. **Consistent focus states** - Use `ring-ring` or `ring-primary`
5. **Accessible contrast** - The OKLCH color system ensures good contrast ratios
6. **Component reusability** - Semantic tokens make components theme-agnostic

## Common Mistakes to Avoid

```tsx
// ❌ DON'T MIX SEMANTIC AND HARDCODED COLORS
<div className="bg-card text-gray-900"> {/* Inconsistent! */}

// ✅ USE SEMANTIC TOKENS CONSISTENTLY
<div className="bg-card text-card-foreground">

// ❌ DON'T USE ARBITRARY VALUES FOR THEME COLORS
<div className="bg-[#3b82f6]"> {/* Hard to maintain */}

// ✅ USE SEMANTIC TOKENS
<div className="bg-primary">

// ❌ DON'T FORGET FOREGROUND COLORS
<button className="bg-primary"> {/* Text might be invisible! */}

// ✅ INCLUDE FOREGROUND COLORS
<button className="bg-primary text-primary-foreground">
```

---

**Remember**: When in doubt, use semantic tokens. They ensure consistency, maintainability, and automatic theme support!
