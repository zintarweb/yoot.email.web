/**
 * Theme Manager
 *
 * Handles theme switching (light/dark mode) and system preference detection
 */

const ThemeManager = {
  STORAGE_KEY: 'yoot-theme',
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
  },

  /**
   * Initialize theme manager
   * Sets up theme based on saved preference or system setting
   */
  init() {
    // Get saved theme or default to system
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);

    if (savedTheme && savedTheme !== this.THEMES.SYSTEM) {
      this.setTheme(savedTheme);
    } else {
      this.setSystemTheme();
    }

    // Listen for system preference changes
    this.watchSystemPreference();

    // Expose toggle function globally for easy access
    window.toggleTheme = () => this.toggle();

    return this;
  },

  /**
   * Get the current theme
   * @returns {string} Current theme ('light' or 'dark')
   */
  getTheme() {
    return document.documentElement.getAttribute('data-theme') || this.THEMES.LIGHT;
  },

  /**
   * Get the saved theme preference
   * @returns {string} Saved preference ('light', 'dark', or 'system')
   */
  getPreference() {
    return localStorage.getItem(this.STORAGE_KEY) || this.THEMES.SYSTEM;
  },

  /**
   * Set the theme
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    if (theme !== this.THEMES.LIGHT && theme !== this.THEMES.DARK) {
      console.warn(`Invalid theme: ${theme}. Using 'light' instead.`);
      theme = this.THEMES.LIGHT;
    }

    document.documentElement.setAttribute('data-theme', theme);

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);

    // Dispatch custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme }
    }));
  },

  /**
   * Save theme preference
   * @param {string} preference - 'light', 'dark', or 'system'
   */
  savePreference(preference) {
    localStorage.setItem(this.STORAGE_KEY, preference);
  },

  /**
   * Set theme based on system preference
   */
  setSystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark ? this.THEMES.DARK : this.THEMES.LIGHT);
  },

  /**
   * Toggle between light and dark themes
   * @returns {string} The new theme
   */
  toggle() {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;

    this.setTheme(newTheme);
    this.savePreference(newTheme);

    return newTheme;
  },

  /**
   * Set specific theme and save preference
   * @param {string} theme - 'light', 'dark', or 'system'
   */
  set(theme) {
    if (theme === this.THEMES.SYSTEM) {
      this.setSystemTheme();
      this.savePreference(this.THEMES.SYSTEM);
    } else {
      this.setTheme(theme);
      this.savePreference(theme);
    }

    return theme;
  },

  /**
   * Watch for system preference changes
   */
  watchSystemPreference() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      // Only auto-switch if user preference is 'system'
      if (this.getPreference() === this.THEMES.SYSTEM) {
        this.setTheme(e.matches ? this.THEMES.DARK : this.THEMES.LIGHT);
      }
    };

    // Use addEventListener for broader browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
  },

  /**
   * Update meta theme-color for mobile browsers
   * @param {string} theme - Current theme
   */
  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    // Set color based on theme
    metaThemeColor.content = theme === this.THEMES.DARK ? '#1f2937' : '#ffffff';
  },

  /**
   * Check if dark mode is currently active
   * @returns {boolean}
   */
  isDark() {
    return this.getTheme() === this.THEMES.DARK;
  },

  /**
   * Check if light mode is currently active
   * @returns {boolean}
   */
  isLight() {
    return this.getTheme() === this.THEMES.LIGHT;
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
