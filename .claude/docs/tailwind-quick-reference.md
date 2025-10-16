# Tailwind Theme Quick Reference

## 🎨 Color Tokens Cheat Sheet

### Backgrounds

| Use Case | Token | Example |
|----------|-------|---------|
| Page background | `bg-background` | `<body className="bg-background">` |
| Card/panel | `bg-card` | `<div className="bg-card">` |
| Muted section | `bg-muted` | `<div className="bg-muted">` |
| Hover state | `bg-accent` | `<button className="hover:bg-accent">` |
| Primary button | `bg-primary` | `<button className="bg-primary">` |
| Secondary button | `bg-secondary` | `<button className="bg-secondary">` |
| Destructive action | `bg-destructive` | `<button className="bg-destructive">` |
| Dropdown/modal | `bg-popover` | `<div className="bg-popover">` |
| Error state (subtle) | `bg-destructive/10` | `<div className="bg-destructive/10">` |

### Text Colors

| Use Case | Token | Example |
|----------|-------|---------|
| Primary text | `text-foreground` | `<h1 className="text-foreground">` |
| Secondary text | `text-muted-foreground` | `<p className="text-muted-foreground">` |
| Primary button text | `text-primary-foreground` | With `bg-primary` |
| Card text | `text-card-foreground` | With `bg-card` |
| Error text | `text-destructive` | `<span className="text-destructive">` |
| Link | `text-primary` | `<a className="text-primary">` |

### Borders

| Use Case | Token | Example |
|----------|-------|---------|
| Default border | `border-border` | `<div className="border border-border">` |
| Input border | `border-input` | `<input className="border-input">` |
| Error border | `border-destructive` | `<input className="border-destructive">` |

### Focus & Ring

| Use Case | Token | Example |
|----------|-------|---------|
| Focus ring | `ring-ring` | `<button className="focus:ring-2 ring-ring">` |
| Primary ring | `ring-primary` | `<input className="focus:ring-primary">` |

## 🚫 Never Use These

```tsx
// ❌ WRONG - Hardcoded colors
bg-white, bg-gray-50, bg-gray-100, bg-gray-900
text-gray-400, text-gray-500, text-gray-600, text-gray-700, text-gray-900
bg-blue-600, text-blue-600, hover:bg-blue-700
bg-red-50, text-red-600, border-red-300
border-gray-300

// ✅ CORRECT - Semantic tokens
bg-background, bg-card, bg-muted
text-foreground, text-muted-foreground
bg-primary, text-primary, hover:bg-primary/90
bg-destructive/10, text-destructive, border-destructive
border-border
```

## 🎯 Common Component Patterns

### Primary Button
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring">
  Click Me
</button>
```

### Card
```tsx
<div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
  Content
</div>
```

### Input Field
```tsx
<input 
  className="bg-background text-foreground border-input focus:border-primary focus:ring-primary"
/>
```

### Error Message
```tsx
<div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-4">
  Error message
</div>
```

### Link
```tsx
<a className="text-primary hover:text-primary/80 underline">
  Link text
</a>
```

### Navigation Active State
```tsx
<a className="text-foreground border-b-2 border-primary">Active</a>
<a className="text-muted-foreground hover:text-foreground">Inactive</a>
```

## 💡 Pro Tips

1. **Opacity Modifiers**: Use `/10`, `/20`, `/90` for subtle variations
   ```tsx
   bg-primary/10    // 10% opacity
   bg-primary/90    // 90% opacity for hover
   ```

2. **Combining Tokens**: Always pair background with foreground
   ```tsx
   bg-primary text-primary-foreground  // ✅ Good
   bg-primary                          // ❌ Text might be invisible
   ```

3. **Disabled States**: Use opacity for disabled elements
   ```tsx
   disabled:bg-primary/40 disabled:text-primary-foreground/60
   ```

4. **Testing**: Check components in both light and dark mode

5. **Consistency**: Use the same patterns across all components

## 📚 Full Documentation

For complete details, see: `.claude/docs/tailwind-theming.md`
