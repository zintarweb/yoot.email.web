/**
 * Toast Notification System
 *
 * Provides toast notifications for user feedback
 */

const Toast = {
  container: null,
  toasts: [],
  defaultOptions: {
    duration: 5000,
    position: 'top-right',
    type: 'info',
    dismissible: true,
    showProgress: true
  },

  /**
   * Initialize toast container
   */
  init(options = {}) {
    const position = options.position || this.defaultOptions.position;

    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = `toast-container toast-container--${position}`;
      this.container.setAttribute('role', 'alert');
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }

    return this;
  },

  /**
   * Show a toast notification
   * @param {Object|string} options - Toast options or message string
   * @returns {HTMLElement} The toast element
   */
  show(options) {
    // Initialize if not already done
    if (!this.container) {
      this.init();
    }

    // Handle string shorthand
    if (typeof options === 'string') {
      options = { message: options };
    }

    const config = { ...this.defaultOptions, ...options };
    const toast = this.createToast(config);

    // Add to container
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    // Auto dismiss
    if (config.duration > 0) {
      const progressBar = toast.querySelector('.toast__progress');
      if (progressBar && config.showProgress) {
        progressBar.style.animationDuration = `${config.duration}ms`;
      }

      setTimeout(() => this.dismiss(toast), config.duration);
    }

    return toast;
  },

  /**
   * Create toast element
   * @param {Object} config - Toast configuration
   * @returns {HTMLElement}
   */
  createToast(config) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${config.type}`;

    if (config.showProgress && config.duration > 0) {
      toast.classList.add('toast--with-progress');
    }

    // Icon based on type
    const icon = this.getIcon(config.type);

    toast.innerHTML = `
      ${icon ? `<div class="toast__icon">${icon}</div>` : ''}
      <div class="toast__content">
        ${config.title ? `<div class="toast__title">${config.title}</div>` : ''}
        <div class="toast__message">${config.message}</div>
        ${config.action ? `
          <div class="toast__action">
            <button class="toast__action-btn" data-action="true">${config.action.label}</button>
          </div>
        ` : ''}
      </div>
      ${config.dismissible ? `
        <button class="toast__close" aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      ` : ''}
      ${config.showProgress && config.duration > 0 ? '<div class="toast__progress"></div>' : ''}
    `;

    // Bind events
    if (config.dismissible) {
      toast.querySelector('.toast__close').addEventListener('click', () => {
        this.dismiss(toast);
      });
    }

    if (config.action) {
      toast.querySelector('[data-action]').addEventListener('click', () => {
        config.action.onClick();
        this.dismiss(toast);
      });
    }

    return toast;
  },

  /**
   * Get icon SVG for toast type
   * @param {string} type - Toast type
   * @returns {string} SVG markup
   */
  getIcon(type) {
    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`,
      error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
      info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`
    };

    return icons[type] || icons.info;
  },

  /**
   * Dismiss a toast
   * @param {HTMLElement} toast - Toast element to dismiss
   */
  dismiss(toast) {
    if (!toast || !toast.parentNode) return;

    toast.classList.add('is-leaving');
    toast.classList.remove('is-visible');

    toast.addEventListener('animationend', () => {
      toast.remove();
      this.toasts = this.toasts.filter(t => t !== toast);
    }, { once: true });
  },

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    [...this.toasts].forEach(toast => this.dismiss(toast));
  },

  /**
   * Shorthand methods for common toast types
   */
  success(message, options = {}) {
    return this.show({ ...options, message, type: 'success' });
  },

  error(message, options = {}) {
    return this.show({ ...options, message, type: 'error' });
  },

  warning(message, options = {}) {
    return this.show({ ...options, message, type: 'warning' });
  },

  info(message, options = {}) {
    return this.show({ ...options, message, type: 'info' });
  },

  /**
   * Show a promise-based toast (loading -> success/error)
   * @param {Promise} promise - Promise to track
   * @param {Object} messages - Messages for each state
   */
  async promise(promise, messages) {
    const loadingToast = this.show({
      message: messages.loading || 'Loading...',
      type: 'info',
      duration: 0,
      dismissible: false,
      showProgress: false
    });

    try {
      const result = await promise;
      this.dismiss(loadingToast);
      this.success(messages.success || 'Success!');
      return result;
    } catch (error) {
      this.dismiss(loadingToast);
      this.error(messages.error || error.message || 'An error occurred');
      throw error;
    }
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Toast;
}
