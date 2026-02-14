/**
 * Theme Configuration System
 *
 * Provides a JavaScript API for white-label theme customization.
 * Generates CSS custom properties from a configuration object.
 */

const ThemeConfig = {
  // Default configuration
  defaults: {
    // Brand identity
    brand: {
      name: 'Yoot Email',
      logo: null, // URL to logo image
      favicon: '/favicon.svg',
    },

    // Color palette - change these for white-label
    colors: {
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
      // Optional accent color
      accent: {
        500: '#8b5cf6',
        600: '#7c3aed',
      },
      // Semantic colors (usually don't change these)
      success: {
        500: '#22c55e',
        600: '#16a34a',
      },
      warning: {
        500: '#f59e0b',
        600: '#d97706',
      },
      danger: {
        500: '#ef4444',
        600: '#dc2626',
      },
      info: {
        500: '#06b6d4',
        600: '#0891b2',
      },
    },

    // Typography
    fonts: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },

    // Component styling
    components: {
      borderRadius: 'default', // 'sharp' | 'default' | 'rounded' | 'pill'
      shadows: 'default', // 'none' | 'subtle' | 'default' | 'prominent'
    },

    // Feature flags
    features: {
      darkMode: true,
      animations: true,
      glassmorphism: true,
    },
  },

  // Current active configuration
  config: null,

  /**
   * Initialize theme with configuration
   * @param {Object} userConfig - User's theme configuration
   */
  init(userConfig = {}) {
    // Deep merge user config with defaults
    this.config = this.deepMerge(this.defaults, userConfig);

    // Apply the theme
    this.apply();

    // Update brand elements
    this.updateBrand();

    return this;
  },

  /**
   * Apply theme configuration to CSS custom properties
   */
  apply() {
    const root = document.documentElement;
    const { colors, fonts, components } = this.config;

    // Apply brand colors
    Object.entries(colors.brand).forEach(([shade, color]) => {
      root.style.setProperty(`--color-brand-${shade}`, color);
    });

    // Apply accent colors if provided
    if (colors.accent) {
      Object.entries(colors.accent).forEach(([shade, color]) => {
        root.style.setProperty(`--color-accent-${shade}`, color);
      });
    }

    // Apply fonts
    root.style.setProperty('--font-sans', fonts.sans);
    root.style.setProperty('--font-mono', fonts.mono);

    // Apply border radius based on preset
    const radiusPresets = {
      sharp: {
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '12px',
        full: '9999px',
      },
      default: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      rounded: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
        full: '9999px',
      },
      pill: {
        sm: '9999px',
        md: '9999px',
        lg: '9999px',
        xl: '9999px',
        '2xl': '9999px',
        full: '9999px',
      },
    };

    const radii = radiusPresets[components.borderRadius] || radiusPresets.default;
    Object.entries(radii).forEach(([size, value]) => {
      root.style.setProperty(`--radius-${size}`, value);
    });

    // Apply shadow intensity
    const shadowPresets = {
      none: {
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
      },
      subtle: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        md: '0 2px 4px -1px rgb(0 0 0 / 0.05)',
        lg: '0 4px 8px -2px rgb(0 0 0 / 0.05)',
        xl: '0 8px 16px -4px rgb(0 0 0 / 0.05)',
      },
      default: {
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      prominent: {
        sm: '0 2px 4px 0 rgb(0 0 0 / 0.15)',
        md: '0 6px 12px -2px rgb(0 0 0 / 0.15)',
        lg: '0 15px 25px -5px rgb(0 0 0 / 0.15)',
        xl: '0 25px 50px -12px rgb(0 0 0 / 0.2)',
      },
    };

    const shadows = shadowPresets[components.shadows] || shadowPresets.default;
    Object.entries(shadows).forEach(([size, value]) => {
      root.style.setProperty(`--shadow-${size}`, value);
    });

    // Handle feature flags
    if (!this.config.features.animations) {
      root.style.setProperty('--duration-fast', '0ms');
      root.style.setProperty('--duration-normal', '0ms');
      root.style.setProperty('--duration-slow', '0ms');
    }

    // Dispatch event for other scripts to react
    window.dispatchEvent(new CustomEvent('themeConfigApplied', {
      detail: this.config
    }));
  },

  /**
   * Update brand elements (logo, title, favicon)
   */
  updateBrand() {
    const { brand } = this.config;

    // Update page title
    if (brand.name) {
      document.title = document.title.replace('Yoot Email', brand.name);
      document.title = document.title.replace('Yoot', brand.name);
    }

    // Update favicon
    if (brand.favicon) {
      let favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.href = brand.favicon;
      }
    }

    // Update logo in sidebar
    if (brand.logo) {
      const logoContainer = document.querySelector('.sidebar .logo h1');
      if (logoContainer) {
        logoContainer.innerHTML = `<img src="${brand.logo}" alt="${brand.name}" style="height: 24px;">`;
      }
    } else if (brand.name) {
      const logoContainer = document.querySelector('.sidebar .logo h1');
      if (logoContainer) {
        logoContainer.textContent = brand.name;
      }
    }
  },

  /**
   * Generate a color palette from a single brand color
   * @param {string} baseColor - Hex color (e.g., '#3b82f6')
   * @returns {Object} Color palette object
   */
  generatePalette(baseColor) {
    // Convert hex to HSL
    const hsl = this.hexToHsl(baseColor);

    // Generate shades
    return {
      50: this.hslToHex({ h: hsl.h, s: hsl.s * 0.3, l: 95 }),
      100: this.hslToHex({ h: hsl.h, s: hsl.s * 0.4, l: 90 }),
      200: this.hslToHex({ h: hsl.h, s: hsl.s * 0.5, l: 80 }),
      300: this.hslToHex({ h: hsl.h, s: hsl.s * 0.6, l: 70 }),
      400: this.hslToHex({ h: hsl.h, s: hsl.s * 0.8, l: 60 }),
      500: baseColor,
      600: this.hslToHex({ h: hsl.h, s: hsl.s, l: hsl.l * 0.85 }),
      700: this.hslToHex({ h: hsl.h, s: hsl.s, l: hsl.l * 0.7 }),
      800: this.hslToHex({ h: hsl.h, s: hsl.s, l: hsl.l * 0.55 }),
      900: this.hslToHex({ h: hsl.h, s: hsl.s, l: hsl.l * 0.4 }),
    };
  },

  /**
   * Quick theme setup from a single brand color
   * @param {string} brandColor - Primary brand color
   * @param {Object} options - Additional options
   */
  fromColor(brandColor, options = {}) {
    const palette = this.generatePalette(brandColor);
    return this.init({
      colors: {
        brand: palette,
      },
      ...options,
    });
  },

  /**
   * Export current theme as CSS
   * @returns {string} CSS custom properties
   */
  exportCSS() {
    const root = document.documentElement;
    const styles = root.style.cssText;
    return `:root {\n  ${styles.split(';').filter(s => s.trim()).join(';\n  ')};\n}`;
  },

  /**
   * Export current theme as JSON
   * @returns {string} JSON configuration
   */
  exportJSON() {
    return JSON.stringify(this.config, null, 2);
  },

  // Utility: Deep merge objects
  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  },

  // Utility: Convert hex to HSL
  hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  // Utility: Convert HSL to hex
  hslToHex({ h, s, l }) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    b = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  },
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeConfig;
}
