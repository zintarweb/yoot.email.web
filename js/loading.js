/**
 * Loading State Manager
 *
 * Provides skeleton loading states and loading indicators throughout the app
 */

const Loading = {
  /**
   * Show skeleton loading state for a container
   * @param {HTMLElement|string} container - Element or selector
   * @param {Object} options - Configuration options
   */
  show(container, options = {}) {
    const el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!el) return;

    const config = {
      type: 'list', // 'list', 'grid', 'card', 'table', 'stats'
      count: 3,
      ...options
    };

    el.dataset.originalContent = el.innerHTML;
    el.classList.add('is-loading');

    let skeletonHTML = '';

    switch (config.type) {
      case 'list':
        skeletonHTML = this.createListSkeleton(config.count);
        break;
      case 'grid':
        skeletonHTML = this.createGridSkeleton(config.count);
        break;
      case 'card':
        skeletonHTML = this.createCardSkeleton();
        break;
      case 'table':
        skeletonHTML = this.createTableSkeleton(config.count);
        break;
      case 'stats':
        skeletonHTML = this.createStatsSkeleton(config.count);
        break;
      default:
        skeletonHTML = this.createGenericSkeleton();
    }

    el.innerHTML = skeletonHTML;
  },

  /**
   * Hide skeleton loading state and restore content
   * @param {HTMLElement|string} container - Element or selector
   * @param {string} newContent - Optional new content to replace with
   */
  hide(container, newContent = null) {
    const el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!el) return;

    el.classList.remove('is-loading');
    el.classList.add('is-loaded');

    if (newContent !== null) {
      el.innerHTML = newContent;
    } else if (el.dataset.originalContent) {
      el.innerHTML = el.dataset.originalContent;
      delete el.dataset.originalContent;
    }

    // Add staggered animation to children
    this.animateChildren(el);

    // Remove loaded class after animation
    setTimeout(() => {
      el.classList.remove('is-loaded');
    }, 500);
  },

  /**
   * Animate children with staggered entrance
   * @param {HTMLElement} container - Container element
   */
  animateChildren(container) {
    const children = container.children;
    Array.from(children).forEach((child, index) => {
      child.style.setProperty('--stagger-index', index);
      child.classList.add('stagger-item');

      // Remove animation class after completion
      setTimeout(() => {
        child.classList.remove('stagger-item');
        child.style.removeProperty('--stagger-index');
      }, 300 + (index * 50));
    });
  },

  /**
   * Create list skeleton HTML
   * @param {number} count - Number of items
   * @returns {string} HTML string
   */
  createListSkeleton(count = 3) {
    let html = '<div class="skeleton-list">';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-list-item">
          <div class="skeleton skeleton--avatar"></div>
          <div class="skeleton-list-content">
            <div class="skeleton skeleton--title" style="width: ${60 + Math.random() * 30}%"></div>
            <div class="skeleton skeleton--text" style="width: ${40 + Math.random() * 40}%"></div>
          </div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  },

  /**
   * Create grid skeleton HTML
   * @param {number} count - Number of items
   * @returns {string} HTML string
   */
  createGridSkeleton(count = 4) {
    let html = '<div class="skeleton-grid">';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton skeleton--card"></div>
          <div class="skeleton skeleton--title" style="margin-top: var(--space-3);"></div>
          <div class="skeleton skeleton--text" style="width: 70%;"></div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  },

  /**
   * Create card skeleton HTML
   * @returns {string} HTML string
   */
  createCardSkeleton() {
    return `
      <div class="skeleton-card-full">
        <div class="skeleton skeleton--card" style="height: 200px;"></div>
        <div style="padding: var(--space-4);">
          <div class="skeleton skeleton--title"></div>
          <div class="skeleton skeleton--text" style="margin-top: var(--space-2);"></div>
          <div class="skeleton skeleton--text" style="width: 60%; margin-top: var(--space-1);"></div>
        </div>
      </div>
    `;
  },

  /**
   * Create table skeleton HTML
   * @param {number} rows - Number of rows
   * @returns {string} HTML string
   */
  createTableSkeleton(rows = 5) {
    let html = '<div class="skeleton-table">';
    // Header
    html += `
      <div class="skeleton-table-row skeleton-table-header">
        <div class="skeleton skeleton--text" style="width: 30%;"></div>
        <div class="skeleton skeleton--text" style="width: 20%;"></div>
        <div class="skeleton skeleton--text" style="width: 25%;"></div>
        <div class="skeleton skeleton--text" style="width: 15%;"></div>
      </div>
    `;
    // Rows
    for (let i = 0; i < rows; i++) {
      html += `
        <div class="skeleton-table-row">
          <div class="skeleton skeleton--text" style="width: ${25 + Math.random() * 20}%;"></div>
          <div class="skeleton skeleton--text" style="width: ${15 + Math.random() * 15}%;"></div>
          <div class="skeleton skeleton--text" style="width: ${20 + Math.random() * 20}%;"></div>
          <div class="skeleton skeleton--text" style="width: ${10 + Math.random() * 10}%;"></div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  },

  /**
   * Create stats skeleton HTML
   * @param {number} count - Number of stat cards
   * @returns {string} HTML string
   */
  createStatsSkeleton(count = 4) {
    let html = '<div class="skeleton-stats">';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-stat-card">
          <div class="skeleton skeleton--text" style="width: 60%; height: 14px;"></div>
          <div class="skeleton skeleton--title" style="width: 40%; height: 32px; margin-top: var(--space-2);"></div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  },

  /**
   * Create generic skeleton HTML
   * @returns {string} HTML string
   */
  createGenericSkeleton() {
    return `
      <div class="skeleton-generic">
        <div class="skeleton skeleton--title" style="width: 40%;"></div>
        <div class="skeleton skeleton--text" style="margin-top: var(--space-3);"></div>
        <div class="skeleton skeleton--text" style="width: 80%; margin-top: var(--space-1);"></div>
        <div class="skeleton skeleton--text" style="width: 60%; margin-top: var(--space-1);"></div>
      </div>
    `;
  },

  /**
   * Wrap an async operation with loading state
   * @param {HTMLElement|string} container - Element or selector
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Loading options
   * @returns {Promise} Result of async function
   */
  async wrap(container, asyncFn, options = {}) {
    this.show(container, options);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      // Allow skeleton to show briefly for better UX
      setTimeout(() => {
        this.hide(container);
      }, options.minDuration || 300);
    }
  },

  /**
   * Show inline loading spinner
   * @param {HTMLElement} button - Button element
   * @param {string} loadingText - Text to show while loading
   */
  buttonStart(button, loadingText = 'Loading...') {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.classList.add('btn--loading');
    button.innerHTML = `
      <span class="btn-spinner"></span>
      ${loadingText}
    `;
  },

  /**
   * Hide inline loading spinner
   * @param {HTMLElement} button - Button element
   * @param {string} newText - Optional new text
   */
  buttonStop(button, newText = null) {
    button.disabled = false;
    button.classList.remove('btn--loading');
    button.textContent = newText || button.dataset.originalText || 'Done';
    delete button.dataset.originalText;
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Loading;
}
