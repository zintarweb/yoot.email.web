# White-Label Customization Guide

This guide explains how to customize the yoot.email application for white-label deployments.

## Quick Start

### Option 1: CSS Theme File (Simplest)

Create a custom theme CSS file and include it after `main.css`:

```html
<link rel="stylesheet" href="css/main.css">
<link rel="stylesheet" href="css/themes/your-brand.css">
```

Example theme file:
```css
:root {
  /* Your brand colors */
  --color-brand-500: #your-primary-color;
  --color-brand-600: #your-hover-color;
  --color-brand-700: #your-active-color;

  /* Generate full palette using ThemeConfig.generatePalette() */
}
```

### Option 2: JavaScript Configuration (More Flexible)

Use the `ThemeConfig` API for dynamic theming:

```javascript
// Include the script
<script src="js/theme-config.js"></script>

// Initialize with your config
ThemeConfig.init({
  brand: {
    name: 'Your Brand',
    logo: '/path/to/logo.svg',
    favicon: '/path/to/favicon.svg',
  },
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      // ... full palette
      500: '#0ea5e9',
      600: '#0284c7',
      // ...
    },
  },
});
```

### Option 3: Quick Setup from Single Color

```javascript
// Generate entire theme from one brand color
ThemeConfig.fromColor('#0ea5e9', {
  brand: {
    name: 'Your Brand',
  },
});
```

---

## Customization Options

### Brand Identity

| Property | Description | Example |
|----------|-------------|---------|
| `brand.name` | Company/product name | `'Acme Email'` |
| `brand.logo` | URL to logo image | `'/assets/logo.svg'` |
| `brand.favicon` | URL to favicon | `'/favicon.ico'` |

### Color Palette

The color system uses a 10-shade palette (50-900). At minimum, provide shades 500, 600, and 700 for interactive elements.

```javascript
colors: {
  brand: {
    50: '#lightest',   // Subtle backgrounds
    100: '#lighter',   // Hover backgrounds
    200: '#light',     // Borders
    300: '#medium-light',
    400: '#medium',
    500: '#primary',   // Main brand color
    600: '#dark',      // Hover states
    700: '#darker',    // Active states
    800: '#darkest',
    900: '#deepest',   // Text on light
  },
  accent: {           // Optional secondary color
    500: '#accent',
    600: '#accent-dark',
  },
}
```

### Typography

```javascript
fonts: {
  sans: "'Your Font', -apple-system, sans-serif",
  mono: "'Your Mono', monospace",
}
```

Don't forget to include your font in the HTML:
```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap" rel="stylesheet">
```

### Component Styling

```javascript
components: {
  borderRadius: 'default',  // 'sharp' | 'default' | 'rounded' | 'pill'
  shadows: 'default',       // 'none' | 'subtle' | 'default' | 'prominent'
}
```

### Feature Flags

```javascript
features: {
  darkMode: true,      // Enable dark mode toggle
  animations: true,    // Enable animations
  glassmorphism: true, // Enable glass effects
}
```

---

## Pre-built Themes

Several example themes are included:

| Theme | File | Description |
|-------|------|-------------|
| Default Blue | `themes/default.css` | Original yoot.email theme |
| Corporate Blue | `themes/corporate-blue.css` | Professional enterprise look |
| Emerald Green | `themes/emerald-green.css` | Fresh, natural feel |
| Sunset Orange | `themes/sunset-orange.css` | Warm, energetic vibe |
| Royal Purple | `themes/royal-purple.css` | Elegant, premium look |

---

## Creating a Custom Theme

### Step 1: Choose Your Brand Color

Pick your primary brand color. This will be shade 500.

### Step 2: Generate the Palette

Use the built-in palette generator:

```javascript
const palette = ThemeConfig.generatePalette('#your-brand-color');
console.log(palette);
// Copy the output to your theme file
```

### Step 3: Create Theme CSS

```css
/* css/themes/your-brand.css */

:root {
  /* Paste generated palette */
  --color-brand-50: #...;
  --color-brand-100: #...;
  /* ... etc */

  /* Update semantic mappings */
  --color-interactive-primary: var(--color-brand-600);
  --color-interactive-hover: var(--color-brand-700);

  /* Custom gradient */
  --gradient-brand: linear-gradient(135deg,
    var(--color-brand-500) 0%,
    var(--color-brand-700) 100%
  );
}

/* Dark mode overrides */
[data-theme="dark"] {
  /* Adjust colors for dark mode */
}
```

### Step 4: Include Theme

```html
<link rel="stylesheet" href="css/main.css">
<link rel="stylesheet" href="css/themes/your-brand.css">
```

---

## Deployment Checklist

- [ ] Update brand colors in theme file
- [ ] Replace logo image
- [ ] Replace favicon
- [ ] Update page titles (or use ThemeConfig)
- [ ] Update meta theme-color in HTML
- [ ] Test dark mode appearance
- [ ] Test all interactive states (hover, focus, active)
- [ ] Test on mobile devices
- [ ] Verify accessibility (contrast ratios)

---

## CSS Variables Reference

### Colors
- `--color-brand-{50-900}` - Brand color palette
- `--color-gray-{50-900}` - Neutral grays
- `--color-success-{500,600}` - Success/positive
- `--color-warning-{500,600}` - Warning/caution
- `--color-danger-{500,600}` - Error/destructive
- `--color-info-{500,600}` - Informational

### Semantic Colors
- `--color-bg-primary` - Main background
- `--color-bg-secondary` - Card/surface background
- `--color-bg-tertiary` - Hover/active background
- `--color-text-primary` - Main text
- `--color-text-secondary` - Subdued text
- `--color-text-tertiary` - Muted text
- `--color-border-primary` - Strong borders
- `--color-border-secondary` - Subtle borders

### Typography
- `--font-sans` - Primary font family
- `--font-mono` - Monospace font family
- `--text-{xs,sm,base,lg,xl,2xl,3xl,4xl,5xl}` - Font sizes
- `--font-{normal,medium,semibold,bold}` - Font weights

### Spacing
- `--space-{0-96}` - Spacing scale (4px base)

### Borders
- `--radius-{sm,md,lg,xl,2xl,full}` - Border radii

### Shadows
- `--shadow-{xs,sm,md,lg,xl,2xl}` - Box shadows
- `--shadow-focus` - Focus ring shadow

### Gradients
- `--gradient-brand` - Primary gradient
- `--gradient-dark` - Dark gradient (for landing pages)

---

## Support

For questions about white-label customization, contact your account manager or refer to the main documentation.
