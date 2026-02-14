# yoot.email UI/UX Modernization Plan

## Executive Summary

This plan outlines a comprehensive modernization of the yoot.email frontend with emphasis on:
- **Modular architecture** for easy updates and maintenance
- **White-label ready** theming system for customization
- **Modern design** patterns and aesthetics
- **Improved developer experience** through better organization

---

## Current State Analysis

### Strengths
- Solid vanilla JS architecture with clear API separation
- Functional CSS variables system (16 tokens)
- Comprehensive feature set (8 views, analytics, bulk operations)
- Responsive design foundation

### Pain Points
- **Monolithic CSS** (1,413 lines in single file)
- **Limited theming** (hardcoded values throughout)
- **No dark mode** support
- **Inconsistent component patterns**
- **Mixed concerns** (layout + components + utilities in one file)
- **No design token system** for white-labeling

---

## Phase 1: Design System Foundation

### 1.1 Design Token Architecture

Create a comprehensive token system in `/css/tokens/`:

```
css/
├── tokens/
│   ├── _colors.css          # Color palette & semantic colors
│   ├── _typography.css      # Font families, sizes, weights
│   ├── _spacing.css         # Spacing scale (4px base)
│   ├── _shadows.css         # Elevation levels
│   ├── _borders.css         # Radii, widths, styles
│   ├── _animations.css      # Timing, easing, keyframes
│   └── _breakpoints.css     # Responsive breakpoints
├── themes/
│   ├── default.css          # Default yoot.email theme
│   ├── dark.css             # Dark mode overrides
│   └── _theme-template.css  # Template for white-label clients
├── components/
│   └── [component files]
├── layouts/
│   └── [layout files]
└── main.css                  # Import orchestrator
```

### 1.2 Color Token System

```css
/* tokens/_colors.css */
:root {
  /* Primitive Colors (Brand-specific, change for white-label) */
  --color-brand-50: #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-200: #bfdbfe;
  --color-brand-300: #93c5fd;
  --color-brand-400: #60a5fa;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;
  --color-brand-800: #1e40af;
  --color-brand-900: #1e3a8a;

  /* Neutral Grays */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Semantic Colors */
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  --color-danger-500: #ef4444;
  --color-info-500: #06b6d4;

  /* Semantic Mappings (Light Mode) */
  --color-bg-primary: var(--color-gray-50);
  --color-bg-secondary: #ffffff;
  --color-bg-tertiary: var(--color-gray-100);
  --color-bg-inverse: var(--color-gray-900);

  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-text-tertiary: var(--color-gray-400);
  --color-text-inverse: #ffffff;

  --color-border-primary: var(--color-gray-200);
  --color-border-secondary: var(--color-gray-100);

  --color-interactive-primary: var(--color-brand-600);
  --color-interactive-hover: var(--color-brand-700);
  --color-interactive-active: var(--color-brand-800);
}
```

### 1.3 Spacing & Typography Tokens

```css
/* tokens/_spacing.css */
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}

/* tokens/_typography.css */
:root {
  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### 1.4 Shadow & Border Tokens

```css
/* tokens/_shadows.css */
:root {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
  --shadow-focus: 0 0 0 3px var(--color-brand-200);
}

/* tokens/_borders.css */
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;
}
```

---

## Phase 2: Component Library

### 2.1 Component File Structure

```
css/components/
├── _button.css
├── _card.css
├── _input.css
├── _select.css
├── _checkbox.css
├── _toggle.css
├── _modal.css
├── _table.css
├── _badge.css
├── _avatar.css
├── _dropdown.css
├── _tabs.css
├── _pagination.css
├── _toast.css
├── _skeleton.css
├── _tooltip.css
└── _progress.css
```

### 2.2 Button Component Example

```css
/* components/_button.css */

/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-tight);
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.btn--primary {
  background: var(--color-interactive-primary);
  color: var(--color-text-inverse);
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-interactive-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn--secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-primary);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.btn--danger {
  background: var(--color-danger-500);
  color: var(--color-text-inverse);
}

/* Sizes */
.btn--xs { padding: var(--space-1) var(--space-2); font-size: var(--text-xs); }
.btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--text-sm); }
.btn--lg { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
.btn--xl { padding: var(--space-4) var(--space-8); font-size: var(--text-lg); }

/* Icon Button */
.btn--icon {
  padding: var(--space-2);
  aspect-ratio: 1;
}
```

### 2.3 Card Component Example

```css
/* components/_card.css */

.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card--elevated {
  box-shadow: var(--shadow-lg);
  border: none;
}

.card--interactive {
  cursor: pointer;
  transition: all 200ms ease;
}

.card--interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card__header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-secondary);
}

.card__body {
  padding: var(--space-5);
}

.card__footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border-secondary);
  background: var(--color-bg-tertiary);
}
```

### 2.4 New Components to Add

#### Toast Notifications
```css
/* components/_toast.css */
.toast-container {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-inverse);
  color: var(--color-text-inverse);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  animation: toast-slide-in 300ms ease;
}

.toast--success { border-left: 4px solid var(--color-success-500); }
.toast--error { border-left: 4px solid var(--color-danger-500); }
.toast--warning { border-left: 4px solid var(--color-warning-500); }

@keyframes toast-slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

#### Skeleton Loading States
```css
/* components/_skeleton.css */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-200) 25%,
    var(--color-gray-100) 50%,
    var(--color-gray-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

.skeleton--text { height: 1em; width: 100%; }
.skeleton--title { height: 1.5em; width: 60%; }
.skeleton--avatar { width: 40px; height: 40px; border-radius: var(--radius-full); }
.skeleton--card { height: 120px; }

@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## Phase 3: Layout System

### 3.1 Layout File Structure

```
css/layouts/
├── _app-shell.css      # Main app container, sidebar, header
├── _grid.css           # CSS Grid utilities
├── _flex.css           # Flexbox utilities
├── _container.css      # Content containers
└── _responsive.css     # Breakpoint utilities
```

### 3.2 Modern App Shell

```css
/* layouts/_app-shell.css */

.app {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.app__sidebar {
  grid-area: sidebar;
  width: var(--sidebar-width, 260px);
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-secondary);
  display: flex;
  flex-direction: column;
  transition: width 200ms ease;
}

.app__sidebar--collapsed {
  --sidebar-width: 72px;
}

.app__header {
  grid-area: header;
  height: 64px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-secondary);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app__main {
  grid-area: main;
  padding: var(--space-6);
  overflow-y: auto;
}

/* Mobile Layout */
@media (max-width: 768px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main";
  }

  .app__sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 300ms ease;
  }

  .app__sidebar--open {
    transform: translateX(0);
  }
}
```

---

## Phase 4: Dark Mode Support

### 4.1 Theme Toggle System

```css
/* themes/dark.css */
[data-theme="dark"] {
  --color-bg-primary: var(--color-gray-900);
  --color-bg-secondary: var(--color-gray-800);
  --color-bg-tertiary: var(--color-gray-700);
  --color-bg-inverse: var(--color-gray-50);

  --color-text-primary: var(--color-gray-50);
  --color-text-secondary: var(--color-gray-300);
  --color-text-tertiary: var(--color-gray-500);
  --color-text-inverse: var(--color-gray-900);

  --color-border-primary: var(--color-gray-700);
  --color-border-secondary: var(--color-gray-800);

  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}

/* Auto dark mode based on system preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Same dark theme variables */
  }
}
```

### 4.2 Theme Toggle JavaScript

```javascript
// js/theme.js
const ThemeManager = {
  STORAGE_KEY: 'yoot-theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(this.STORAGE_KEY, next);
  },

  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
};
```

---

## Phase 5: White-Label Configuration

### 5.1 Theme Configuration File

```javascript
// config/theme.config.js
const ThemeConfig = {
  // Brand Identity
  brand: {
    name: 'yoot.email',
    logo: '/assets/logo.svg',
    favicon: '/favicon.svg',
  },

  // Color Palette
  colors: {
    // Change these for white-label
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Accent color (optional secondary brand color)
    accent: {
      500: '#8b5cf6',
      600: '#7c3aed',
    }
  },

  // Typography
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  // Component Defaults
  components: {
    borderRadius: 'lg', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
    shadow: 'md',       // 'none' | 'sm' | 'md' | 'lg'
  },

  // Feature Flags
  features: {
    darkMode: true,
    animations: true,
    glassmorphism: true,
  }
};

// Generate CSS variables from config
function generateThemeCSS(config) {
  let css = ':root {\n';

  // Brand colors
  Object.entries(config.colors.brand).forEach(([shade, color]) => {
    css += `  --color-brand-${shade}: ${color};\n`;
  });

  // Fonts
  css += `  --font-sans: ${config.fonts.sans};\n`;
  css += `  --font-mono: ${config.fonts.mono};\n`;

  css += '}\n';
  return css;
}
```

### 5.2 White-Label Deployment

```
white-label/
├── client-a/
│   ├── theme.config.js
│   ├── assets/
│   │   ├── logo.svg
│   │   └── favicon.svg
│   └── custom.css
├── client-b/
│   └── ...
└── build.js          # Generates client-specific builds
```

---

## Phase 6: Modern Design Patterns

### 6.1 Micro-Interactions

```css
/* Enhanced hover states */
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Focus ring animation */
.input:focus {
  box-shadow: 0 0 0 0 var(--color-brand-200);
  animation: focus-ring 200ms ease forwards;
}

@keyframes focus-ring {
  to { box-shadow: 0 0 0 3px var(--color-brand-200); }
}

/* Staggered list animations */
.list-item {
  animation: list-item-in 300ms ease backwards;
}

.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
/* ... */

@keyframes list-item-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
```

### 6.2 Glassmorphism (Optional)

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .glass {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 6.3 Modern Gradients

```css
:root {
  --gradient-brand: linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-700) 100%);
  --gradient-surface: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%);
  --gradient-glow: radial-gradient(circle at 50% 0%, var(--color-brand-400) 0%, transparent 50%);
}
```

---

## Phase 7: JavaScript Modernization

### 7.1 Component-Based JS Architecture

```javascript
// js/components/Modal.js
class Modal {
  constructor(options = {}) {
    this.options = {
      closeOnBackdrop: true,
      closeOnEscape: true,
      ...options
    };
    this.element = null;
  }

  open(content) {
    this.element = this.render(content);
    document.body.appendChild(this.element);
    this.bindEvents();

    // Animation
    requestAnimationFrame(() => {
      this.element.classList.add('modal--visible');
    });
  }

  close() {
    this.element.classList.remove('modal--visible');
    this.element.addEventListener('transitionend', () => {
      this.element.remove();
    }, { once: true });
  }

  render(content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <button class="modal__close btn btn--ghost btn--icon">
          <svg>...</svg>
        </button>
        <div class="modal__content">${content}</div>
      </div>
    `;
    return modal;
  }

  bindEvents() {
    // Event binding logic
  }
}

export default Modal;
```

### 7.2 File Structure

```
js/
├── app.js              # Main application entry
├── api.js              # API client (keep existing)
├── state.js            # State management
├── theme.js            # Theme management
├── router.js           # View routing
├── components/
│   ├── Modal.js
│   ├── Toast.js
│   ├── Dropdown.js
│   ├── Table.js
│   └── Pagination.js
├── views/
│   ├── Dashboard.js
│   ├── Accounts.js
│   ├── Inbox.js
│   ├── Rules.js
│   ├── Lists.js
│   ├── Contacts.js
│   └── Analytics.js
└── utils/
    ├── dom.js
    ├── date.js
    └── format.js
```

---

## Phase 8: Implementation Roadmap

### Sprint 1: Foundation (Week 1-2) - COMPLETED
- [x] Create design token files
- [x] Set up CSS file structure
- [x] Implement main.css import orchestration
- [x] Create base component styles (buttons, inputs, cards)
- [x] Set up dark mode toggle infrastructure

**Completed Items:**
- `css/tokens/_colors.css` - Full color palette with semantic mappings
- `css/tokens/_typography.css` - Font families, sizes, weights, line heights
- `css/tokens/_spacing.css` - 4px-based spacing scale with semantic names
- `css/tokens/_shadows.css` - Elevation system with colored shadows
- `css/tokens/_borders.css` - Border radii and widths
- `css/tokens/_animations.css` - Timing, easing, keyframe animations
- `css/tokens/_breakpoints.css` - Responsive breakpoint reference
- `css/base/_reset.css` - Modern CSS reset
- `css/base/_typography.css` - Base typography styles
- `css/themes/default.css` - Light theme (default)
- `css/themes/dark.css` - Full dark mode support
- `css/themes/_theme-template.css` - White-label template
- `css/layouts/_app-shell.css` - Sidebar + header + main layout
- `css/layouts/_grid.css` - CSS Grid utilities
- `css/layouts/_container.css` - Container and flex utilities
- `css/components/_button.css` - Full button system
- `css/components/_card.css` - Card variants and stat cards
- `css/components/_input.css` - Text inputs and form fields
- `css/components/_select.css` - Select and dropdown triggers
- `css/components/_checkbox.css` - Checkbox and radio buttons
- `css/components/_toggle.css` - Toggle switches
- `css/components/_modal.css` - Modal and drawer components
- `css/components/_table.css` - Data tables with sorting
- `css/components/_badge.css` - Badges and status indicators
- `css/components/_avatar.css` - Avatar and avatar groups
- `css/components/_dropdown.css` - Dropdown menus
- `css/components/_tabs.css` - Tab navigation
- `css/components/_pagination.css` - Pagination controls
- `css/components/_toast.css` - Toast notifications
- `css/components/_skeleton.css` - Loading skeletons
- `css/components/_tooltip.css` - Tooltips and popovers
- `css/components/_progress.css` - Progress bars and indicators
- `css/utilities/_helpers.css` - Utility classes
- `css/main.css` - Import orchestrator
- `js/theme.js` - Theme manager with system preference detection
- `js/toast.js` - Toast notification system

### Sprint 2: Components & Migration (Week 2-3) - COMPLETED
- [x] Migrate HTML files to use new design system
  - [x] index.html - Landing page with animated gradient, Inter font
  - [x] login.html - Glassmorphism design, reCAPTCHA, theme toggle
  - [x] app.html - Full design system integration, dark mode support
- [x] Add Toast notification system integration
- [x] Implement theme toggle in all pages
- [x] Add loading states (skeleton screens) throughout app
  - [x] Created js/loading.js - Loading state manager
  - [x] Enhanced css/components/_skeleton.css with layouts
  - [x] Dashboard skeleton for stats and activity
- [x] Implement micro-interactions for all interactive elements
  - [x] Created css/utilities/_interactions.css
  - [x] Hover lift effects on cards and panels
  - [x] Nav item slide + icon scale on hover
  - [x] Button press states and glow effects
  - [x] View entrance animations
  - [x] Staggered list item animations

### Sprint 3: Layout & Views (Week 3-4) - COMPLETED
- [x] Implement new app shell layout
  - [x] Enhanced css/layouts/_app-shell.css (already complete)
  - [x] Mobile sidebar with overlay backdrop
  - [x] Mobile menu button in header
- [x] Update all view sections with new design
  - [x] Created css/views/_dashboard.css - Stats grid, activity feed, quick actions
  - [x] Created css/views/_inbox.css - Email list, folder sidebar, preview pane
  - [x] Created css/views/_accounts.css - Account cards, provider options, status badges
  - [x] Created css/views/_rules.css - Rule cards, conditions, builder
  - [x] Created css/views/_analytics.css - Stats, panels, charts, bulk actions
- [x] Improve responsive behavior
  - [x] Mobile menu open/close with overlay
  - [x] Responsive grid layouts for all views
  - [x] Mobile email list card layout
  - [x] Touch-friendly folder navigation
- [x] Add animations and transitions
  - [x] Sidebar slide animation
  - [x] View entrance animations
  - [x] Card hover effects throughout

### Sprint 4: Polish & White-Label (Week 4-5) - COMPLETED
- [x] Create theme configuration system
  - [x] js/theme-config.js - Full configuration API
  - [x] Dynamic CSS variable generation
  - [x] Color palette generator from single color
  - [x] Brand identity management (logo, name, favicon)
- [x] Document white-label customization
  - [x] docs/WHITE-LABEL-GUIDE.md - Comprehensive documentation
  - [x] CSS variables reference
  - [x] Deployment checklist
- [x] Create example white-label themes
  - [x] css/themes/corporate-blue.css
  - [x] css/themes/emerald-green.css
  - [x] css/themes/sunset-orange.css
  - [x] css/themes/royal-purple.css
- [x] Accessibility audit and fixes
  - [x] css/utilities/_accessibility.css
  - [x] Skip links for keyboard navigation
  - [x] ARIA live regions for announcements
  - [x] Reduced motion support
  - [x] High contrast mode support
  - [x] Forced colors (Windows) support
  - [x] Touch target sizing
  - [x] Color-blind friendly status indicators
- [x] Performance optimization
  - [x] css/utilities/_performance.css
  - [x] GPU acceleration utilities
  - [x] Content visibility optimization
  - [x] CSS containment classes
  - [x] Print stylesheet
  - [x] Reduced data mode support

---

## File Migration Plan

### CSS Migration

| Current | New Location |
|---------|--------------|
| style.css (all) | Split into: |
| - Variables section | tokens/*.css |
| - Button styles | components/_button.css |
| - Card styles | components/_card.css |
| - Form styles | components/_input.css, _select.css, etc. |
| - Table styles | components/_table.css |
| - Modal styles | components/_modal.css |
| - Layout styles | layouts/_app-shell.css |
| - Utility classes | utilities/_helpers.css |

### main.css Import Order

```css
/* main.css */

/* 1. Tokens (Design System Foundation) */
@import 'tokens/_colors.css';
@import 'tokens/_typography.css';
@import 'tokens/_spacing.css';
@import 'tokens/_shadows.css';
@import 'tokens/_borders.css';
@import 'tokens/_animations.css';

/* 2. Base Styles */
@import 'base/_reset.css';
@import 'base/_typography.css';

/* 3. Layout */
@import 'layouts/_app-shell.css';
@import 'layouts/_grid.css';
@import 'layouts/_container.css';

/* 4. Components */
@import 'components/_button.css';
@import 'components/_card.css';
@import 'components/_input.css';
@import 'components/_select.css';
@import 'components/_checkbox.css';
@import 'components/_toggle.css';
@import 'components/_modal.css';
@import 'components/_table.css';
@import 'components/_badge.css';
@import 'components/_dropdown.css';
@import 'components/_tabs.css';
@import 'components/_pagination.css';
@import 'components/_toast.css';
@import 'components/_skeleton.css';
@import 'components/_tooltip.css';

/* 5. View-Specific Styles */
@import 'views/_dashboard.css';
@import 'views/_inbox.css';
@import 'views/_analytics.css';

/* 6. Themes */
@import 'themes/dark.css';

/* 7. Utilities */
@import 'utilities/_helpers.css';
```

---

## Success Metrics

### Design Quality
- Consistent use of design tokens throughout
- No hardcoded colors, spacing, or typography values
- All components follow established patterns

### Modularity
- Each component in its own file
- Clear separation of concerns
- Easy to update individual components

### White-Label Ready
- Theme can be customized via single config file
- Brand colors propagate automatically
- Logo/favicon easily replaceable

### Performance
- CSS file size reduced through modular loading
- Animations use GPU-accelerated properties
- No layout thrashing

### Accessibility
- WCAG 2.1 AA compliance
- Proper focus management
- Screen reader compatible

---

## Notes

- **No frameworks required** - This plan maintains the vanilla JS approach
- **Progressive enhancement** - Dark mode and animations graceful degrade
- **Backwards compatible** - Existing functionality preserved during migration
- **Mobile-first** - Responsive design from the ground up

---

## Status Log

### January 23, 2026 - Phase 1 Complete
**Sprint 1: Foundation** has been fully implemented:
- Created complete design token architecture (7 token files)
- Established modular CSS file structure (35+ files)
- Built comprehensive component library (16 components)
- Implemented dark mode with system preference detection
- Created white-label theme template
- Added JavaScript utilities (ThemeManager, Toast)

**Files Created:** 35+
**Total New CSS:** ~4,500 lines of modular, well-documented code

**Next Steps:** Proceed to Sprint 2 - Migrate existing app styles to use new design system

### January 23, 2026 - Phase 2 In Progress
**Sprint 2: Components & Migration** implementation started:
- Migrated all HTML pages to use new design system:
  - `index.html` - Landing page with animated gradient background, floating effects, Inter font, theme toggle
  - `login.html` - Glassmorphism login card, form components, reCAPTCHA v3, theme toggle
  - `app.html` - Full design system integration with bridge approach (main.css + style.css)
- Added Toast notification system integration
- Theme toggle implemented in all pages
- Dark mode fully functional across all pages

**Bridge Approach:** app.html loads both `css/main.css` (new design system) and `css/style.css` (existing styles) to maintain compatibility during migration. New styles override old ones via CSS variable system.

**Key Features Added:**
- Dark mode with system preference detection
- Theme persistence via localStorage
- Animated gradients and micro-interactions on landing
- Glassmorphism design on login
- Toast notifications ready for use

### January 23, 2026 - Sprint 2 Complete
**Sprint 2: Components & Migration** fully implemented:

**New Files Created:**
- `js/loading.js` - Loading state manager with skeleton utilities
- `css/utilities/_interactions.css` - Micro-interaction utilities

**Enhanced Files:**
- `css/components/_skeleton.css` - Added skeleton layouts, stagger animations, button loading states
- `css/main.css` - Added interactions import
- `app.html` - Enhanced with micro-interactions and loading states

**Micro-Interactions Added:**
- Stat cards: hover lift + border highlight
- Navigation: slide right + icon scale on hover
- Buttons: hover glow, press states
- Analytics panels: hover lift
- Sections: subtle shadow on hover
- Views: fade-in entrance animation

**Loading System Features:**
- Skeleton types: list, grid, card, table, stats
- Staggered fade-in for loaded content
- Button loading spinners
- Pulse update highlights
- Reduced motion support

**Next Steps:** Proceed to Sprint 3 - Layout & Views updates

### January 23, 2026 - Sprint 3 Complete
**Sprint 3: Layout & Views** fully implemented:

**New View CSS Files Created:**
- `css/views/_dashboard.css` - Dashboard layout, stats grid, activity feed, quick actions
- `css/views/_inbox.css` - Inbox layout, folder sidebar, email list, preview pane
- `css/views/_accounts.css` - Account cards, provider options, status badges, add account
- `css/views/_rules.css` - Rule cards, conditions display, rule builder
- `css/views/_analytics.css` - Stats summary, sync progress, bulk actions, analytics panels

**Mobile Enhancements:**
- Added mobile menu button with hamburger icon
- Sidebar overlay backdrop for mobile
- Open/close mobile menu functions
- Close on overlay click and Escape key
- Prevented body scroll when menu is open
- Close menu on nav item click

**Responsive Features by View:**
- Dashboard: 2-column to 1-column stats grid, quick actions collapse
- Inbox: Folder sidebar becomes horizontal chips, email table becomes cards
- Accounts: Vertical card layout on mobile
- Analytics: Single column panels, full-width bulk actions

**CSS Architecture Update:**
- main.css now imports all view CSS files
- Views section added to import order (section 7)

**Next Steps:** Proceed to Sprint 4 - Polish & White-Label system

### January 23, 2026 - Sprint 4 Complete / PROJECT COMPLETE
**Sprint 4: Polish & White-Label** fully implemented:

**Theme Configuration System:**
- `js/theme-config.js` - Complete white-label configuration API
  - `ThemeConfig.init()` - Initialize with custom config
  - `ThemeConfig.fromColor()` - Generate theme from single color
  - `ThemeConfig.generatePalette()` - Create color shades
  - `ThemeConfig.exportCSS()` / `ThemeConfig.exportJSON()` - Export theme
  - Dynamic CSS variable updates
  - Brand identity management (logo, name, favicon)

**Example Themes Created:**
- `corporate-blue.css` - Professional enterprise theme
- `emerald-green.css` - Fresh, natural theme
- `sunset-orange.css` - Warm, energetic theme
- `royal-purple.css` - Elegant, premium theme

**Accessibility Improvements:**
- Skip link for keyboard navigation
- ARIA live region for announcements
- `announce()` function for screen readers
- High contrast mode support
- Forced colors (Windows) support
- Touch target sizing (44px minimum)
- Color-blind friendly status indicators
- Reduced motion preference support
- Focus indicators and trap utilities

**Performance Optimizations:**
- GPU acceleration utilities
- Content visibility for off-screen content
- CSS containment classes
- Lazy loading utilities
- Scroll performance optimizations
- Print stylesheet
- Reduced data mode support

**Documentation:**
- `docs/WHITE-LABEL-GUIDE.md` - Complete white-label guide
  - Quick start options (CSS, JS, single color)
  - Full customization options
  - Pre-built themes list
  - Step-by-step theme creation
  - CSS variables reference
  - Deployment checklist

---

## PROJECT COMPLETION SUMMARY

### Files Created: 50+

**Design Tokens (7 files):**
- `_colors.css`, `_typography.css`, `_spacing.css`, `_shadows.css`
- `_borders.css`, `_animations.css`, `_breakpoints.css`

**Base Styles (2 files):**
- `_reset.css`, `_typography.css`

**Layouts (3 files):**
- `_app-shell.css`, `_grid.css`, `_container.css`

**Components (17 files):**
- `_button.css`, `_card.css`, `_input.css`, `_select.css`
- `_checkbox.css`, `_toggle.css`, `_modal.css`, `_table.css`
- `_badge.css`, `_avatar.css`, `_dropdown.css`, `_tabs.css`
- `_pagination.css`, `_toast.css`, `_skeleton.css`
- `_tooltip.css`, `_progress.css`

**Views (5 files):**
- `_dashboard.css`, `_inbox.css`, `_accounts.css`
- `_rules.css`, `_analytics.css`

**Themes (6 files):**
- `default.css`, `dark.css`, `_theme-template.css`
- `corporate-blue.css`, `emerald-green.css`
- `sunset-orange.css`, `royal-purple.css`

**Utilities (4 files):**
- `_helpers.css`, `_interactions.css`
- `_accessibility.css`, `_performance.css`

**JavaScript (4 files):**
- `theme.js`, `theme-config.js`, `toast.js`, `loading.js`

**Documentation (1 file):**
- `WHITE-LABEL-GUIDE.md`

### Total CSS: ~6,000+ lines of modular, well-documented code

---

*Plan created: January 2026*
*Phase 1 completed: January 23, 2026*
*Sprint 2 completed: January 23, 2026*
*Sprint 3 completed: January 23, 2026*
*Sprint 4 completed: January 23, 2026*
*PROJECT COMPLETED: January 23, 2026*
