/**
 * Email Utilities - Main Application
 */

// ============ State ============
const state = {
    currentView: 'dashboard',
    users: [],
    currentUserId: localStorage.getItem('emailutils-user-id') || '1',
    accounts: [],
    rules: [],
    lists: {},
    contactLists: [],
    selectedListType: 'WHITELIST',
    selectedAccountId: localStorage.getItem('emailutils-account') || 'all',
    selectedFolderId: localStorage.getItem('emailutils-folder') || 'all',
    folders: [],
    currentEmails: [],
    sortColumn: localStorage.getItem('emailutils-sort-column') || 'date',
    sortDirection: localStorage.getItem('emailutils-sort-direction') || 'desc',
    columnWidths: JSON.parse(localStorage.getItem('emailutils-column-widths') || '{}'),
    pageSize: 20,
    totalEmails: 0,
    nextPageToken: null,
    currentPageToken: null,
    pageTokenHistory: [],  // Stack of previous page tokens for going back
    currentPageIndex: 0,
    // Date-range pagination for "All Accounts" mode
    beforeDate: null,           // ISO date string - fetch emails before this date
    beforeDateHistory: [],      // Stack of previous beforeDate values for going back
    nextBeforeDate: null,       // Next page's beforeDate value
    allAccountsExhausted: false // true when all accounts have no more emails
};

// ============ Initialization ============
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSidebar();
    loadUsers();

    // Restore last viewed page
    const savedView = localStorage.getItem('emailutils-view') || 'dashboard';
    switchView(savedView);

    // Check for running background sync jobs
    initGlobalSyncMonitor();
});

// ============ User Management ============
async function loadUsers() {
    try {
        const users = await API.users.list();
        state.users = users;

        const userSelect = document.getElementById('user-select');
        userSelect.innerHTML = users.map(user =>
            `<option value="${user.id}" ${user.id == state.currentUserId ? 'selected' : ''}>${user.displayName}</option>`
        ).join('');

        // Update current user display
        const currentUser = users.find(u => u.id == state.currentUserId);
        if (currentUser) {
            document.getElementById('user-email').textContent = currentUser.email;
        }

        console.log('Users loaded:', users);
    } catch (error) {
        console.error('Failed to load users:', error);
        document.getElementById('user-email').textContent = 'Offline';
    }
}

function switchUser(userId) {
    if (!userId) return;

    state.currentUserId = userId;
    API.setUserId(userId);

    // Update user email display
    const currentUser = state.users.find(u => u.id == userId);
    if (currentUser) {
        document.getElementById('user-email').textContent = currentUser.email;
    }

    // Reload the current view to reflect the new user's data
    switchView(state.currentView);

    console.log('Switched to user:', userId);
}

// ============ Sidebar Toggle ============
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const isCollapsed = localStorage.getItem('emailutils-sidebar-collapsed') === 'true';

    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        updateToggleIcon(true);
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const isCollapsed = sidebar.classList.toggle('collapsed');

    localStorage.setItem('emailutils-sidebar-collapsed', isCollapsed);
    updateToggleIcon(isCollapsed);
}

function updateToggleIcon(isCollapsed) {
    const toggleBtn = document.querySelector('.sidebar-toggle-top');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('.icon');
        icon.textContent = isCollapsed ? '▶' : '◀';
    }
}

async function checkApiConnection() {
    try {
        const health = await API.health();
        console.log('API Connected:', health);
        document.getElementById('user-email').textContent = 'Connected';
    } catch (error) {
        console.error('API Connection Failed:', error);
        document.getElementById('user-email').textContent = 'Offline';
    }
}

// ============ Navigation ============
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // List type tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedListType = btn.dataset.listType;
            loadListEntries(state.selectedListType);
        });
    });
}

function switchView(viewName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        accounts: 'Email Accounts',
        inbox: 'Unified Inbox',
        rules: 'Automation Rules',
        lists: 'Email Lists',
        contacts: 'Contacts',
        analytics: 'Analytics',
    };
    document.getElementById('page-title').textContent = titles[viewName] || viewName;

    state.currentView = viewName;

    // Persist current view
    localStorage.setItem('emailutils-view', viewName);

    // Load view data
    switch (viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'inbox':
            loadInbox();
            break;
        case 'rules':
            loadRules();
            break;
        case 'lists':
            loadListEntries(state.selectedListType);
            break;
        case 'contacts':
            loadContactLists();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// ============ Dashboard ============
async function loadDashboard() {
    try {
        // Load account count
        const accounts = await API.accounts.list();
        document.getElementById('stat-accounts').textContent = accounts.length;
        document.getElementById('stat-rules').textContent = '0';
        document.getElementById('stat-contacts').textContent = '0';
        document.getElementById('stat-blocked').textContent = '0';
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// ============ Inbox ============
async function loadInbox() {
    const container = document.getElementById('inbox-list');
    const accountFilter = document.getElementById('inbox-account-filter');
    const folderList = document.getElementById('folder-list');

    try {
        // First, load accounts to populate filter
        const accounts = await API.accounts.list();
        state.accounts = accounts;

        // Populate account filter dropdown
        accountFilter.innerHTML = '<option value="all">All Accounts</option>' +
            accounts.map(a => `<option value="${a.id}">${a.emailAddress} (${a.provider})</option>`).join('');

        // Restore selection from state (which loads from localStorage)
        if (state.selectedAccountId && (state.selectedAccountId === 'all' || accounts.find(a => a.id == state.selectedAccountId))) {
            accountFilter.value = state.selectedAccountId;
        } else {
            state.selectedAccountId = 'all';
        }

        if (accounts.length === 0) {
            container.innerHTML = '<p class="empty-state">Connect an email account to view your inbox</p>';
            folderList.innerHTML = '<p class="empty-state">No accounts</p>';
            return;
        }

        // Load folders for selected account
        await loadFolders();

        // Show loading state
        container.innerHTML = '<p class="empty-state">Loading emails...</p>';

        // Reset pagination for new inbox load
        state.pageTokenHistory = [];
        state.beforeDate = null;
        state.beforeDateHistory = [];
        state.allAccountsExhausted = false;
        state.currentPageIndex = 0;
        state.currentPageToken = null;
        state.nextPageToken = null;

        await fetchEmailPage(container);

    } catch (error) {
        console.error('Failed to load inbox:', error);
        container.innerHTML = `<p class="empty-state">Failed to load inbox: ${error.message}</p>`;
    }
}

async function loadFolders() {
    const folderList = document.getElementById('folder-list');
    const selectedAccount = state.selectedAccountId;

    if (selectedAccount === 'all') {
        folderList.innerHTML = '<p class="empty-state" style="padding: 10px; font-size: 0.8rem;">Select an account to view folders</p>';
        state.folders = [];
        state.selectedFolderId = 'all';
        return;
    }

    try {
        const folders = await API.accounts.getFolders(selectedAccount);
        state.folders = folders;

        // Sort: system folders first (INBOX, SENT, etc.), then alphabetically
        const systemFolders = ['INBOX', 'Inbox', 'SENT', 'Sent', 'Sent Items', 'DRAFT', 'Drafts', 'TRASH', 'Trash', 'Deleted Items', 'SPAM', 'Junk Email', 'STARRED', 'IMPORTANT'];
        folders.sort((a, b) => {
            const aIdx = systemFolders.findIndex(f => a.name.toUpperCase().includes(f.toUpperCase()));
            const bIdx = systemFolders.findIndex(f => b.name.toUpperCase().includes(f.toUpperCase()));
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        folderList.innerHTML = `
            <div class="folder-item ${state.selectedFolderId === 'all' ? 'active' : ''}" onclick="selectFolder('all')">
                <span class="folder-name">All Mail</span>
            </div>
            ${folders.map(f => `
                <div class="folder-item ${state.selectedFolderId === f.id ? 'active' : ''}" onclick="selectFolder('${f.id}')">
                    <span class="folder-name">${escapeHtml(f.name)}</span>
                    ${f.unreadCount > 0 ? `<span class="folder-count">${f.unreadCount}</span>` : ''}
                </div>
            `).join('')}
        `;
    } catch (error) {
        console.error('Failed to load folders:', error);
        folderList.innerHTML = '<p class="empty-state">Failed to load folders</p>';
    }
}

function selectFolder(folderId) {
    state.selectedFolderId = folderId;
    localStorage.setItem('emailutils-folder', folderId);
    loadInbox();
}

async function fetchEmailPage(container, pageToken = null) {
    const accounts = state.accounts;
    const selectedAccount = state.selectedAccountId;
    const selectedFolder = state.selectedFolderId;

    try {
        container.innerHTML = '<p class="empty-state">Loading emails...</p>';

        let result;
        let emails = [];

        if (selectedAccount === 'all') {
            // For "all accounts", use date-range pagination for proper interleaving
            let totalEstimate = 0;
            const perAccountSize = Math.max(5, Math.ceil(state.pageSize / accounts.length));

            // Fetch from all accounts using the current beforeDate filter
            for (const account of accounts) {
                try {
                    // Skip accounts that need re-authentication
                    const needsReauth = account.lastSyncError?.includes('re-authenticate') ||
                                       account.lastSyncError?.includes('token') ||
                                       account.syncStatus === 'ERROR';
                    if (needsReauth) {
                        console.log(`Skipping ${account.emailAddress} - needs re-authentication`);
                        continue;
                    }

                    // Use date-based filtering instead of page tokens
                    const accountResult = await API.accounts.getEmails(
                        account.id,
                        perAccountSize,
                        null,  // no page token
                        state.beforeDate,  // before date filter
                        null   // no after date
                    );

                    const accountEmails = (accountResult.emails || []).map(e => ({
                        ...e,
                        accountId: account.id,
                        accountEmail: account.emailAddress
                    }));
                    emails = emails.concat(accountEmails);
                    totalEstimate += accountResult.total || accountEmails.length;
                } catch (err) {
                    console.error(`Failed to fetch emails for ${account.emailAddress}:`, err);
                }
            }

            // Sort combined results by date (newest first)
            emails.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Limit to page size and find the oldest email for next page
            const pageEmails = emails.slice(0, state.pageSize);
            let nextBeforeDate = null;

            if (pageEmails.length > 0 && emails.length > state.pageSize) {
                // Find the oldest email in the current page to use as next page's before filter
                const oldestEmail = pageEmails[pageEmails.length - 1];
                nextBeforeDate = oldestEmail.date;
            }

            result = {
                emails: pageEmails,
                total: totalEstimate,
                nextPageToken: nextBeforeDate ? 'has-more' : null,
                nextBeforeDate: nextBeforeDate
            };
        } else if (selectedFolder !== 'all') {
            // Fetch from specific folder
            result = await API.accounts.getEmailsByFolder(selectedAccount, selectedFolder, state.pageSize);
            const account = accounts.find(a => a.id == selectedAccount);
            emails = (result.emails || []).map(e => ({
                ...e,
                accountId: account.id,
                accountEmail: account.emailAddress,
                folderId: selectedFolder
            }));
        } else {
            // Fetch from single account with pagination
            result = await API.accounts.getEmails(selectedAccount, state.pageSize, pageToken);
            const account = accounts.find(a => a.id == selectedAccount);
            emails = (result.emails || []).map(e => ({
                ...e,
                accountId: account.id,
                accountEmail: account.emailAddress
            }));
        }

        state.currentEmails = emails;
        state.totalEmails = result.total || emails.length;
        state.nextPageToken = result.nextPageToken || null;
        state.nextBeforeDate = result.nextBeforeDate || null;

        if (emails.length === 0) {
            container.innerHTML = '<p class="empty-state">No emails found</p>';
            return;
        }

        renderEmailTable(container);

    } catch (error) {
        console.error('Failed to fetch emails:', error);
        container.innerHTML = `<p class="empty-state">Failed to load emails: ${error.message}</p>`;
    }
}

async function goToNextPage() {
    if (!state.nextPageToken) return;

    const selectedAccount = state.selectedAccountId;

    if (selectedAccount === 'all') {
        // Save current beforeDate to history and use nextBeforeDate
        state.beforeDateHistory.push(state.beforeDate);
        state.beforeDate = state.nextBeforeDate;
    } else {
        // Save current token to history before moving forward
        state.pageTokenHistory.push(state.currentPageToken || null);
        state.currentPageToken = state.nextPageToken;
    }

    state.currentPageIndex++;
    await fetchEmailPage(document.getElementById('inbox-list'), state.nextPageToken);
}

async function goToPrevPage() {
    if (state.currentPageIndex <= 0) return;

    const selectedAccount = state.selectedAccountId;
    state.currentPageIndex--;

    if (selectedAccount === 'all') {
        // Restore previous beforeDate
        state.beforeDate = state.beforeDateHistory.pop() || null;
    } else {
        const prevToken = state.pageTokenHistory.pop();
        state.currentPageToken = prevToken;
    }

    await fetchEmailPage(document.getElementById('inbox-list'), state.currentPageToken);
}

async function goToFirstPage() {
    state.pageTokenHistory = [];
    state.beforeDate = null;
    state.beforeDateHistory = [];
    state.allAccountsExhausted = false;
    state.currentPageIndex = 0;
    state.currentPageToken = null;

    await fetchEmailPage(document.getElementById('inbox-list'), null);
}

// ============ Email Table Rendering ============
function getColumnStyle(colClass) {
    return state.columnWidths[colClass] ? `style="width: ${state.columnWidths[colClass]}"` : '';
}

// Account colors for visual differentiation
const accountColors = [
    '#2563eb', // blue
    '#16a34a', // green
    '#dc2626', // red
    '#9333ea', // purple
    '#ea580c', // orange
    '#0891b2', // cyan
    '#c026d3', // fuchsia
    '#ca8a04', // yellow
];

function getAccountColor(accountId) {
    const index = state.accounts.findIndex(a => a.id == accountId);
    return accountColors[index % accountColors.length];
}

function renderEmailTable(container) {
    const emails = state.currentEmails;
    const pagination = renderPagination();
    const showAccountIndicator = state.selectedAccountId === 'all' && state.accounts.length > 1;

    container.innerHTML = `
        ${showAccountIndicator ? renderAccountLegend() : ''}
        ${pagination}
        <table class="email-table">
            <thead>
                <tr>
                    <th class="col-checkbox" ${getColumnStyle('col-checkbox')}>
                        <input type="checkbox" onclick="toggleAllEmails(this)">
                    </th>
                    <th class="col-sender sortable ${state.sortColumn === 'from' ? 'sort-' + state.sortDirection : ''}"
                        data-column="from" onclick="handleSort('from')" ${getColumnStyle('col-sender')}>
                        From<div class="resizer" onmousedown="initResize(event)"></div>
                    </th>
                    <th class="col-subject sortable ${state.sortColumn === 'subject' ? 'sort-' + state.sortDirection : ''}"
                        data-column="subject" onclick="handleSort('subject')" ${getColumnStyle('col-subject')}>
                        Subject<div class="resizer" onmousedown="initResize(event)"></div>
                    </th>
                    <th class="col-snippet" ${getColumnStyle('col-snippet')}>
                        Preview<div class="resizer" onmousedown="initResize(event)"></div>
                    </th>
                    <th class="col-date sortable ${state.sortColumn === 'date' ? 'sort-' + state.sortDirection : ''}"
                        data-column="date" onclick="handleSort('date')" ${getColumnStyle('col-date')}>
                        Date
                    </th>
                </tr>
            </thead>
            <tbody>
                ${emails.map(email => `
                    <tr class="${email.isUnread ? 'unread' : ''}" onclick="showEmailDetail(${email.accountId}, '${email.id}')"
                        ${showAccountIndicator ? `style="border-left: 4px solid ${getAccountColor(email.accountId)};"` : ''}>
                        <td class="col-checkbox">
                            <input type="checkbox" onclick="event.stopPropagation()" data-email-id="${email.id}" data-account-id="${email.accountId}">
                        </td>
                        <td class="col-sender" title="${escapeHtml(email.from || '')}">${escapeHtml(extractName(email.from))}</td>
                        <td class="col-subject" title="${escapeHtml(email.subject || '')}">${escapeHtml(email.subject || '(No subject)')}</td>
                        <td class="col-snippet" title="${escapeHtml(email.snippet || '')}">${escapeHtml(email.snippet || '')}</td>
                        <td class="col-date">${formatDate(email.date)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${pagination}
    `;
}

function renderAccountLegend() {
    return `
        <div class="account-legend">
            ${state.accounts.map((account, index) => `
                <span class="account-legend-item">
                    <span class="account-legend-color" style="background: ${accountColors[index % accountColors.length]};"></span>
                    ${escapeHtml(account.emailAddress.split('@')[0])}
                </span>
            `).join('')}
        </div>
    `;
}

function handleSort(column) {
    if (state.sortColumn === column) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortColumn = column;
        state.sortDirection = column === 'date' ? 'desc' : 'asc';
    }

    // Persist sort options
    localStorage.setItem('emailutils-sort-column', state.sortColumn);
    localStorage.setItem('emailutils-sort-direction', state.sortDirection);

    sortEmails();
    renderEmailTable(document.getElementById('inbox-list'));
}

function sortEmails() {
    // Sort current page of emails client-side
    const col = state.sortColumn;
    const dir = state.sortDirection === 'asc' ? 1 : -1;

    state.currentEmails.sort((a, b) => {
        let valA, valB;

        switch (col) {
            case 'from':
                valA = extractName(a.from).toLowerCase();
                valB = extractName(b.from).toLowerCase();
                break;
            case 'subject':
                valA = (a.subject || '').toLowerCase();
                valB = (b.subject || '').toLowerCase();
                break;
            case 'date':
            default:
                valA = new Date(a.date);
                valB = new Date(b.date);
                break;
        }

        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
    });
}

function renderPagination() {
    const currentPage = state.currentPageIndex;
    const hasNext = !!state.nextPageToken;
    const hasPrev = currentPage > 0;
    const start = currentPage * state.pageSize + 1;
    const end = start + state.currentEmails.length - 1;

    // Show pagination if there's more than one page worth of emails
    if (!hasNext && !hasPrev) return '';

    return `
        <div class="pagination">
            <span class="pagination-info">${start}-${end} of ${state.totalEmails > end ? state.totalEmails + '+' : end}</span>
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="goToFirstPage()" ${!hasPrev ? 'disabled' : ''}>««</button>
                <button class="pagination-btn" onclick="goToPrevPage()" ${!hasPrev ? 'disabled' : ''}>«</button>
                <span class="pagination-pages">Page ${currentPage + 1}</span>
                <button class="pagination-btn" onclick="goToNextPage()" ${!hasNext ? 'disabled' : ''}>»</button>
            </div>
        </div>
    `;
}

function toggleAllEmails(checkbox) {
    const checkboxes = document.querySelectorAll('.email-table tbody input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

// ============ Column Resizing ============
let resizing = null;

function initResize(e) {
    e.stopPropagation();
    const th = e.target.parentElement;
    const table = th.closest('table');
    const startX = e.pageX;
    const startWidth = th.offsetWidth;

    resizing = { th, table, startX, startWidth };
    e.target.classList.add('resizing');

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
}

function doResize(e) {
    if (!resizing) return;

    const diff = e.pageX - resizing.startX;
    const newWidth = Math.max(50, resizing.startWidth + diff);
    resizing.th.style.width = newWidth + 'px';
}

function stopResize() {
    if (resizing) {
        // Save column width
        const columnClass = Array.from(resizing.th.classList).find(c => c.startsWith('col-'));
        if (columnClass) {
            state.columnWidths[columnClass] = resizing.th.style.width;
            localStorage.setItem('emailutils-column-widths', JSON.stringify(state.columnWidths));
        }

        document.querySelector('.resizer.resizing')?.classList.remove('resizing');
        resizing = null;
    }
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
}

// Handle account filter change
document.getElementById('inbox-account-filter')?.addEventListener('change', (e) => {
    state.selectedAccountId = e.target.value;
    state.selectedFolderId = 'all';
    localStorage.setItem('emailutils-account', e.target.value);
    localStorage.setItem('emailutils-folder', 'all');
    loadInbox();
});

function extractName(from) {
    if (!from) return 'Unknown';
    // Extract name from "Name <email>" format
    const match = from.match(/^([^<]+)</);
    return match ? match[1].trim() : from.split('@')[0];
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    // Today: show time
    if (diff < 86400000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    // This year: show month/day
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    // Older: show full date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function showEmailDetail(accountId, messageId) {
    try {
        const email = await API.accounts.getEmail(accountId, messageId);

        const content = `
            <div class="email-detail">
                <div class="email-header-detail">
                    <strong>From:</strong> ${escapeHtml(email.from)}<br>
                    <strong>To:</strong> ${escapeHtml(email.to)}<br>
                    <strong>Date:</strong> ${new Date(email.date).toLocaleString()}<br>
                    <strong>Subject:</strong> ${escapeHtml(email.subject)}
                </div>
                <hr style="margin: 15px 0; border: none; border-top: 1px solid var(--border);">
                <div class="email-body" style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">
                    ${email.body.startsWith('<') ? email.body : escapeHtml(email.body)}
                </div>
            </div>
        `;
        showModal(email.subject || '(No subject)', content);
    } catch (error) {
        alert('Failed to load email: ' + error.message);
    }
}

// ============ Accounts ============
async function loadAccounts() {
    const container = document.getElementById('accounts-list');

    try {
        const accounts = await API.accounts.list();
        state.accounts = accounts;

        if (accounts.length === 0) {
            container.innerHTML = '<p class="empty-state">No email accounts configured</p>';
            return;
        }

        container.innerHTML = accounts.map(account => {
            const needsReauth = account.lastSyncError?.includes('re-authenticate') ||
                               account.lastSyncError?.includes('token') ||
                               account.syncStatus === 'ERROR';
            const statusClass = needsReauth ? 'error' : account.syncStatus.toLowerCase();
            const statusText = needsReauth ? 'Disconnected' : account.syncStatus;

            return `
                <div class="account-card ${needsReauth ? 'needs-reauth' : ''}">
                    <div class="account-info">
                        <h4>${account.emailAddress}</h4>
                        <span class="provider">${account.provider}</span>
                        ${needsReauth ? `<span class="auth-error">Authentication expired - please reconnect</span>` : ''}
                    </div>
                    <div class="account-actions">
                        <span class="account-status ${statusClass}">${statusText}</span>
                        ${needsReauth
                            ? `<button class="btn btn-primary" onclick="reconnectAccount('${account.provider.toLowerCase()}', '${account.emailAddress}')">Reconnect</button>`
                            : `<button class="btn btn-secondary" onclick="syncAccount(${account.id})">Sync</button>`
                        }
                        <button class="btn btn-danger" onclick="removeAccount(${account.id}, '${escapeHtml(account.emailAddress)}')">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Failed to load accounts</p>';
    }
}

function showAddAccountModal() {
    const content = `
        <div class="oauth-providers">
            <p style="margin-bottom: 20px; color: var(--text-secondary);">Choose your email provider:</p>

            <button class="btn btn-oauth" onclick="connectOAuth('google')" style="width: 100%; margin-bottom: 10px; padding: 15px; display: flex; align-items: center; gap: 12px; background: white; border: 1px solid var(--border);">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span>Connect Gmail</span>
            </button>

            <button class="btn btn-oauth" onclick="connectOAuth('microsoft')" style="width: 100%; margin-bottom: 10px; padding: 15px; display: flex; align-items: center; gap: 12px; background: white; border: 1px solid var(--border);">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
                <span>Connect Outlook</span>
            </button>

            <button class="btn btn-oauth" onclick="showCustomImapForm()" style="width: 100%; padding: 15px; display: flex; align-items: center; gap: 12px; background: white; border: 1px solid var(--border);">
                <span style="font-size: 20px;">📧</span>
                <span>Other (IMAP)</span>
            </button>
        </div>

        <div id="custom-imap-form" style="display: none;">
            <form id="add-account-form" onsubmit="handleAddImapAccount(event)">
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" name="emailAddress" required>
                </div>
                <div class="form-group">
                    <label>IMAP Host</label>
                    <input type="text" name="imapHost" required placeholder="imap.example.com">
                </div>
                <div class="form-group">
                    <label>IMAP Port</label>
                    <input type="number" name="imapPort" value="993">
                </div>
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" name="username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Account</button>
                </div>
            </form>
        </div>
    `;
    showModal('Add Email Account', content);
}

function showCustomImapForm() {
    document.querySelector('.oauth-providers').style.display = 'none';
    document.getElementById('custom-imap-form').style.display = 'block';
}

async function connectOAuth(provider, loginHint = null) {
    try {
        let url = `/oauth/authorize/${provider}?userId=${API.currentUserId}`;
        if (loginHint) {
            url += `&login_hint=${encodeURIComponent(loginHint)}`;
        }
        const response = await API.get(url);

        if (response.error) {
            alert(response.message || response.error);
            return;
        }

        // Open OAuth in popup
        const width = 500;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const popup = window.open(
            response.authUrl,
            'oauth',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for OAuth completion
        window.addEventListener('message', function handler(event) {
            if (event.data?.type === 'oauth-complete') {
                window.removeEventListener('message', handler);
                closeModal();
                loadAccounts();
            }
        });

        // Also poll for popup close
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                loadAccounts();
            }
        }, 1000);

    } catch (error) {
        alert('Failed to start OAuth: ' + error.message);
    }
}

async function handleAddImapAccount(event) {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    data.provider = 'IMAP_CUSTOM';

    try {
        await API.accounts.create(data);
        closeModal();
        loadAccounts();
    } catch (error) {
        alert('Failed to add account: ' + error.message);
    }
}

async function syncAccount(id) {
    try {
        await API.accounts.sync(id);
        loadAccounts();
    } catch (error) {
        alert('Failed to sync account: ' + error.message);
    }
}

async function removeAccount(id, emailAddress) {
    if (!confirm(`Are you sure you want to remove ${emailAddress}? This will disconnect the account from Email Utilities.`)) {
        return;
    }

    try {
        await API.accounts.delete(id);
        loadAccounts();
        loadDashboard(); // Refresh dashboard stats
    } catch (error) {
        alert('Failed to remove account: ' + error.message);
    }
}

function reconnectAccount(provider, email) {
    // Map provider names to OAuth endpoints
    const providerMap = {
        'gmail': 'google',
        'outlook': 'microsoft'
    };
    const oauthProvider = providerMap[provider] || provider;
    connectOAuth(oauthProvider, email);
}

// ============ Rules ============
async function loadRules() {
    const container = document.getElementById('rules-list');

    try {
        const rules = await API.rules.list();
        state.rules = rules;

        if (rules.length === 0) {
            container.innerHTML = '<p class="empty-state">No rules configured</p>';
            return;
        }

        container.innerHTML = rules.map(rule => `
            <div class="rule-card">
                <div class="rule-header">
                    <h4>${rule.name}</h4>
                    <label class="toggle">
                        <input type="checkbox" ${rule.enabled ? 'checked' : ''}
                               onchange="toggleRule(${rule.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <p class="rule-conditions">${rule.description || 'No description'}</p>
                <div class="rule-actions">
                    <button class="btn btn-secondary" onclick="editRule(${rule.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteRule(${rule.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Failed to load rules</p>';
    }
}

function showAddRuleModal() {
    const content = `
        <form id="add-rule-form" onsubmit="handleAddRule(event)">
            <div class="form-group">
                <label>Rule Name</label>
                <input type="text" name="name" required placeholder="e.g., Move newsletters to folder">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="2" placeholder="What does this rule do?"></textarea>
            </div>
            <div class="form-group">
                <label>Condition Logic</label>
                <select name="conditionLogic">
                    <option value="ALL">ALL conditions must match (AND)</option>
                    <option value="ANY">ANY condition can match (OR)</option>
                </select>
            </div>
            <p class="empty-state">Condition and action builders coming soon...</p>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Rule</button>
            </div>
        </form>
    `;
    showModal('Create Rule', content);
}

async function handleAddRule(event) {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));

    try {
        await API.rules.create(data);
        closeModal();
        loadRules();
    } catch (error) {
        alert('Failed to create rule: ' + error.message);
    }
}

async function toggleRule(id, enabled) {
    try {
        await API.rules.toggle(id, enabled);
    } catch (error) {
        alert('Failed to toggle rule: ' + error.message);
        loadRules();
    }
}

async function deleteRule(id) {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
        await API.rules.delete(id);
        loadRules();
    } catch (error) {
        alert('Failed to delete rule: ' + error.message);
    }
}

// ============ Lists ============
async function loadListEntries(type) {
    const container = document.getElementById('lists-content');

    try {
        const lists = await API.lists.list(type);
        const list = lists[0]; // Get first list of this type

        if (!list || list.entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No entries in this list</p>
                    <button class="btn btn-primary" onclick="showAddListEntryModal('${type}')">
                        + Add Entry
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="section">
                <div class="view-header">
                    <span>${list.entries.length} entries</span>
                    <button class="btn btn-primary" onclick="showAddListEntryModal('${type}')">
                        + Add Entry
                    </button>
                </div>
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 10px;">Pattern</th>
                            <th style="text-align: left; padding: 10px;">Type</th>
                            <th style="text-align: right; padding: 10px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.entries.map(entry => `
                            <tr>
                                <td style="padding: 10px;">${entry.pattern}</td>
                                <td style="padding: 10px;">${entry.matchType}</td>
                                <td style="text-align: right; padding: 10px;">
                                    <button class="btn btn-danger" onclick="removeListEntry(${list.id}, ${entry.id})">
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Failed to load list</p>';
    }
}

function showAddListEntryModal(type) {
    const content = `
        <form id="add-entry-form" onsubmit="handleAddListEntry(event, '${type}')">
            <div class="form-group">
                <label>Email or Domain Pattern</label>
                <input type="text" name="pattern" required
                       placeholder="email@example.com or @domain.com">
            </div>
            <div class="form-group">
                <label>Notes (optional)</label>
                <input type="text" name="notes" placeholder="Why are you adding this?">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add to ${type}</button>
            </div>
        </form>
    `;
    showModal(`Add to ${type}`, content);
}

async function handleAddListEntry(event, type) {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));

    try {
        // First, get or create the list
        let lists = await API.lists.list(type);
        let list = lists[0];

        if (!list) {
            list = await API.lists.create({ name: type, listType: type });
        }

        await API.lists.addEntry(list.id, data);
        closeModal();
        loadListEntries(type);
    } catch (error) {
        alert('Failed to add entry: ' + error.message);
    }
}

async function removeListEntry(listId, entryId) {
    if (!confirm('Remove this entry?')) return;

    try {
        await API.lists.removeEntry(listId, entryId);
        loadListEntries(state.selectedListType);
    } catch (error) {
        alert('Failed to remove entry: ' + error.message);
    }
}

// ============ Contacts ============
async function loadContactLists() {
    const container = document.getElementById('contact-lists');

    try {
        const lists = await API.contacts.listGroups();
        state.contactLists = lists;

        if (lists.length === 0) {
            container.innerHTML = '<p class="empty-state">No contact lists created</p>';
            return;
        }

        container.innerHTML = lists.map(list => `
            <div class="section">
                <div class="view-header">
                    <h4>${list.name}</h4>
                    <span>${list.contacts?.length || 0} contacts</span>
                </div>
                <p>${list.description || ''}</p>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Failed to load contact lists</p>';
    }
}

function showAddContactListModal() {
    const content = `
        <form id="add-contact-list-form" onsubmit="handleAddContactList(event)">
            <div class="form-group">
                <label>List Name</label>
                <input type="text" name="name" required placeholder="e.g., Family, Work, VIPs">
            </div>
            <div class="form-group">
                <label>Description (optional)</label>
                <textarea name="description" rows="2"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create List</button>
            </div>
        </form>
    `;
    showModal('Create Contact List', content);
}

async function handleAddContactList(event) {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));

    try {
        await API.contacts.createGroup(data);
        closeModal();
        loadContactLists();
    } catch (error) {
        alert('Failed to create list: ' + error.message);
    }
}

// ============ Modal ============
function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-container').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

// Close modal on backdrop click
document.getElementById('modal-container')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-container') {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ============ Analytics ============
let syncPollInterval = null;
let currentJobId = null;

// Global sync monitoring - check on app load
async function initGlobalSyncMonitor() {
    try {
        const status = await API.analytics.getSyncStatus();
        if (status.status === 'RUNNING') {
            currentJobId = status.jobId;
            showGlobalSyncIndicator(status);
            startGlobalSyncPolling();
        }
    } catch (error) {
        console.log('No active sync job');
    }
}

function showGlobalSyncIndicator(status) {
    const indicator = document.getElementById('global-sync-indicator');
    const textEl = document.getElementById('global-sync-text');
    const progressEl = document.getElementById('global-sync-progress');

    indicator.classList.remove('hidden');
    textEl.textContent = status.currentAccount || 'Syncing...';
    progressEl.textContent = (status.progress || 0) + '%';
}

function hideGlobalSyncIndicator() {
    document.getElementById('global-sync-indicator').classList.add('hidden');
}

function startGlobalSyncPolling() {
    if (syncPollInterval) clearInterval(syncPollInterval);

    syncPollInterval = setInterval(async () => {
        try {
            const status = await API.analytics.getSyncStatus();

            if (status.status === 'RUNNING') {
                showGlobalSyncIndicator(status);
                // Also update analytics page if visible
                if (state.currentView === 'analytics') {
                    updateSyncProgress(status);
                }
            } else if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
                clearInterval(syncPollInterval);
                syncPollInterval = null;
                hideGlobalSyncIndicator();
                hideSyncProgress();
                loadNotifications(); // Refresh notifications to show completion
                // Reload analytics if on that page
                if (state.currentView === 'analytics') {
                    loadAnalytics();
                }
            }
        } catch (error) {
            console.error('Global sync poll error:', error);
        }
    }, 2000);
}

async function loadAnalytics() {
    const loadingEl = document.getElementById('analytics-loading');
    const contentEl = document.getElementById('analytics-content');

    // Check for running sync job first
    await checkSyncStatus();

    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';

    try {
        const daysFilter = document.getElementById('analytics-days-filter')?.value;
        const days = daysFilter ? parseInt(daysFilter) : null;

        // Load segregated senders first
        try {
            const segData = await API.bulk.getSegregatedSenders();
            segregatedSenders = new Set(segData.segregatedSenders.map(s => s.senderEmail.toLowerCase()));
        } catch (e) {
            console.log('Could not load segregated senders:', e.message);
            segregatedSenders = new Set();
        }

        const data = await API.analytics.getAll(10, days);

        // Update summary stats
        document.getElementById('analytics-total').textContent = data.summary.totalEmails.toLocaleString();
        document.getElementById('analytics-unread').textContent = data.summary.unreadEmails.toLocaleString();
        document.getElementById('analytics-senders').textContent = data.summary.uniqueSenders.toLocaleString();
        document.getElementById('analytics-read-rate').textContent = data.summary.readRatio + '%';

        // Store top senders for spam scanning
        topSendersEmails = [
            ...data.topSenders.map(s => s.email),
            ...data.unreadBySender.map(s => s.email)
        ].filter((v, i, a) => a.indexOf(v) === i); // unique

        // Render panels with checkboxes on top senders and unread senders
        renderAnalyticsList('analytics-top-senders', data.topSenders, item => ({
            email: item.email,
            name: item.name,
            value: item.count + ' emails'
        }), true);

        renderAnalyticsList('analytics-unread-senders', data.unreadBySender, item => ({
            email: item.email,
            name: item.name,
            value: item.unreadCount + ' unread',
            valueClass: item.unreadCount > 10 ? 'danger' : item.unreadCount > 5 ? 'warning' : ''
        }), true);

        renderAnalyticsList('analytics-reply-ranking', data.replyRanking, item => ({
            email: item.email,
            name: '',
            value: item.sentCount + ' sent'
        }));

        renderAnalyticsList('analytics-low-reply', data.lowReplyRatio, item => ({
            email: item.email,
            name: '',
            value: (item.replyRatio * 100).toFixed(0) + '% reply',
            valueClass: item.replyRatio < 0.1 ? 'danger' : 'warning',
            details: `${item.received} received, ${item.replies} replied`
        }));

        // Reset bulk action buttons
        updateBulkActionButtons();

        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';

    } catch (error) {
        console.error('Failed to load analytics:', error);
        loadingEl.innerHTML = `<p>Failed to load analytics. <button class="btn btn-primary" onclick="startBackgroundSync()">Sync Data First</button></p>`;
    }
}

function renderAnalyticsList(containerId, items, mapper, showCheckboxes = false) {
    const container = document.getElementById(containerId);

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="analytics-empty">No data available</div>';
        return;
    }

    container.innerHTML = items.map(item => {
        const mapped = mapper(item);
        const isSegregated = segregatedSenders.has(mapped.email.toLowerCase());
        return `
            <div class="analytics-item ${isSegregated ? 'segregated' : ''}">
                ${showCheckboxes ? `
                    <input type="checkbox" class="sender-checkbox" data-email="${escapeHtml(mapped.email)}"
                           onclick="event.stopPropagation(); updateBulkActionButtons();">
                ` : ''}
                <div class="analytics-item-info">
                    <div class="analytics-item-email">
                        ${escapeHtml(mapped.email)}
                        ${isSegregated ? '<span class="segregated-badge" title="Already segregated">✓</span>' : ''}
                    </div>
                    ${mapped.name ? `<div class="analytics-item-name">${escapeHtml(mapped.name)}</div>` : ''}
                </div>
                ${mapped.details ? `<div class="analytics-item-details">${mapped.details}</div>` : ''}
                <div class="analytics-item-value ${mapped.valueClass || ''}">${mapped.value}</div>
            </div>
        `;
    }).join('');
}

// Store top senders for spam scanning
let topSendersEmails = [];

// Store segregated senders (already processed)
let segregatedSenders = new Set();

// ============ Spam Check ============
async function scanTopSendersForSpam() {
    const btn = document.getElementById('scan-spam-btn');
    const resultsDiv = document.getElementById('spam-check-results');
    const summaryDiv = document.getElementById('spam-check-summary');
    const listDiv = document.getElementById('spam-check-list');

    if (topSendersEmails.length === 0) {
        alert('No senders to scan. Please sync analytics data first.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Scanning...';
    resultsDiv.classList.remove('hidden');
    summaryDiv.innerHTML = '<span>Checking against Spamhaus...</span>';
    listDiv.innerHTML = '';

    try {
        const results = await API.spam.checkEmails(topSendersEmails);
        const summary = results._summary;
        delete results._summary;

        // Show summary
        summaryDiv.innerHTML = `
            <span class="spam-summary-item clean">✓ ${summary.clean} clean</span>
            <span class="spam-summary-item listed">⚠ ${summary.listed} listed</span>
            <span>Total: ${summary.total}</span>
        `;

        // Show listed senders first, then clean
        const entries = Object.entries(results).sort((a, b) => {
            if (a[1].listed && !b[1].listed) return -1;
            if (!a[1].listed && b[1].listed) return 1;
            return 0;
        });

        listDiv.innerHTML = entries.map(([email, result]) => `
            <div class="spam-item">
                <div>
                    <div class="spam-item-email">${escapeHtml(email)}</div>
                    ${result.listed ? `<div class="spam-item-reason">${escapeHtml(result.reason)}</div>` : ''}
                </div>
                <span class="spam-item-status ${result.listed ? 'listed' : 'clean'}">
                    ${result.listed ? '⚠ LISTED' : '✓ Clean'}
                </span>
            </div>
        `).join('');

        btn.textContent = 'Scan Top Senders';
        btn.disabled = false;

    } catch (error) {
        console.error('Spam check failed:', error);
        summaryDiv.innerHTML = `<span style="color: var(--danger);">Error: ${error.message}</span>`;
        btn.textContent = 'Scan Top Senders';
        btn.disabled = false;
    }
}

async function checkSingleEmail(email) {
    try {
        const result = await API.spam.checkEmail(email);
        if (result.listed) {
            alert(`⚠️ ${email} is LISTED:\n${result.reason}`);
        } else {
            alert(`✓ ${email} is clean (not on Spamhaus blocklist)`);
        }
    } catch (error) {
        alert('Check failed: ' + error.message);
    }
}

async function startBackgroundSync() {
    const btn = document.getElementById('sync-btn');
    btn.disabled = true;
    btn.textContent = 'Starting...';

    try {
        const result = await API.analytics.startSync();
        currentJobId = result.jobId;
        showSyncProgress();
        // Show global indicator so user can navigate away
        showGlobalSyncIndicator({ progress: 0, currentAccount: 'Starting...' });
        startGlobalSyncPolling();
    } catch (error) {
        alert('Failed to start sync: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Sync Data';
    }
}

async function checkSyncStatus() {
    try {
        const status = await API.analytics.getSyncStatus();
        if (status.status === 'RUNNING') {
            currentJobId = status.jobId;
            showSyncProgress();
            updateSyncProgress(status);
            startSyncPolling();
        }
    } catch (error) {
        console.error('Failed to check sync status:', error);
    }
}

function showSyncProgress() {
    document.getElementById('sync-progress').classList.remove('hidden');
    document.getElementById('sync-btn').disabled = true;
    document.getElementById('sync-btn').textContent = 'Syncing...';
}

function hideSyncProgress() {
    document.getElementById('sync-progress').classList.add('hidden');
    document.getElementById('sync-btn').disabled = false;
    document.getElementById('sync-btn').textContent = 'Sync Data';
}

function updateSyncProgress(status) {
    document.getElementById('sync-status-text').textContent = status.statusMessage || 'Syncing...';
    document.getElementById('sync-progress-bar').style.width = status.progress + '%';
    document.getElementById('sync-current-account').textContent = status.currentAccount || '';

    // Build detailed stats
    let statsText = `${status.totalEmailsProcessed || 0} processed`;
    statsText += ` (${status.totalEmailsSynced} new, ${status.totalEmailsSkipped} skipped)`;

    // Add rate if available
    if (status.emailsPerSecond > 0) {
        statsText += ` • ${status.emailsPerSecond}/s`;
    }

    // Add countdown if available
    if (status.estimatedSecondsRemaining > 0) {
        statsText += ` • ${formatTimeRemaining(status.estimatedSecondsRemaining)}`;
    }

    document.getElementById('sync-stats').textContent = statsText;
}

function formatTimeRemaining(seconds) {
    if (seconds < 60) {
        return `~${seconds}s remaining`;
    } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `~${mins}m ${secs}s remaining`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `~${hours}h ${mins}m remaining`;
    }
}

async function cancelBackgroundSync() {
    if (!currentJobId) return;

    try {
        await API.analytics.cancelSync(currentJobId);
        clearInterval(syncPollInterval);
        syncPollInterval = null;
        hideSyncProgress();
        hideGlobalSyncIndicator();
    } catch (error) {
        alert('Failed to cancel: ' + error.message);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add event listener for days filter
document.getElementById('analytics-days-filter')?.addEventListener('change', () => {
    loadAnalytics();
});

// ============ Notifications ============
async function loadNotifications() {
    try {
        const countData = await API.notifications.getUnreadCount();
        const badge = document.getElementById('notification-badge');

        if (countData.count > 0) {
            badge.textContent = countData.count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Failed to load notification count:', error);
    }
}

async function toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    const isHidden = dropdown.classList.toggle('hidden');

    if (!isHidden) {
        await renderNotificationList();
    }
}

async function renderNotificationList() {
    const container = document.getElementById('notification-list');

    try {
        const notifications = await API.notifications.getAll();

        if (notifications.length === 0) {
            container.innerHTML = '<p class="empty-state" style="padding: 20px;">No notifications</p>';
            return;
        }

        container.innerHTML = notifications.slice(0, 10).map(n => `
            <div class="notification-item ${n.read ? '' : 'unread'}" onclick="handleNotificationClick(${n.id}, '${n.actionUrl || ''}')">
                <div class="notification-item-title">${escapeHtml(n.title)}</div>
                <div class="notification-item-message">${escapeHtml(n.message)}</div>
                <div class="notification-item-time">${formatTimeAgo(n.createdAt)}</div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="empty-state" style="padding: 20px;">Failed to load notifications</p>';
    }
}

async function handleNotificationClick(id, actionUrl) {
    await API.notifications.markAsRead(id);
    loadNotifications();

    if (actionUrl) {
        const view = actionUrl.replace('/', '');
        if (view) switchView(view);
    }

    document.getElementById('notification-dropdown').classList.add('hidden');
}

async function markAllNotificationsRead() {
    await API.notifications.markAllAsRead();
    loadNotifications();
    renderNotificationList();
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Close notification dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notification-dropdown');
    const bell = document.querySelector('.notification-bell');
    if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

// Poll for new notifications every 30 seconds
setInterval(loadNotifications, 30000);

// Initial notification load
document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
});

// ============ Bulk Email Operations ============

function getSelectedSenderEmails() {
    const checkboxes = document.querySelectorAll('.sender-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.email);
}

function updateBulkActionButtons() {
    const selected = getSelectedSenderEmails();
    const moveBtn = document.getElementById('bulk-move-btn');
    const segregateBtn = document.getElementById('bulk-segregate-btn');
    const selectInfo = document.getElementById('bulk-select-info');

    if (moveBtn) {
        moveBtn.disabled = selected.length === 0;
    }
    if (segregateBtn) {
        segregateBtn.disabled = selected.length === 0;
    }
    if (selectInfo) {
        selectInfo.textContent = selected.length > 0
            ? `${selected.length} sender${selected.length > 1 ? 's' : ''} selected`
            : '';
    }
}

function selectAllSenders() {
    const checkboxes = document.querySelectorAll('.sender-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updateBulkActionButtons();
}

async function showMoveModal() {
    const selected = getSelectedSenderEmails();
    if (selected.length === 0) {
        alert('Please select at least one sender');
        return;
    }

    // Show loading in modal
    const content = `
        <div id="move-modal-content">
            <p>Loading folders...</p>
        </div>
    `;
    showModal('Move Emails from Selected Senders', content);

    try {
        const foldersData = await API.bulk.getFolders();

        let folderOptionsHtml = '';
        for (const [accountEmail, accountData] of Object.entries(foldersData)) {
            if (accountData.error) continue;
            const folders = accountData.folders || [];
            folderOptionsHtml += `<optgroup label="${escapeHtml(accountEmail)}">`;
            for (const folder of folders) {
                folderOptionsHtml += `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`;
            }
            folderOptionsHtml += '</optgroup>';
        }

        document.getElementById('move-modal-content').innerHTML = `
            <p style="margin-bottom: 15px;">Move all emails from <strong>${selected.length}</strong> selected sender(s) to:</p>

            <div class="form-group">
                <label>
                    <input type="radio" name="folder-option" value="existing" checked onchange="toggleNewFolderInput()">
                    Choose existing folder
                </label>
                <select id="move-folder-select" class="form-control" style="margin-top: 8px;">
                    ${folderOptionsHtml}
                </select>
            </div>

            <div class="form-group">
                <label>
                    <input type="radio" name="folder-option" value="new" onchange="toggleNewFolderInput()">
                    Create new folder
                </label>
                <input type="text" id="new-folder-name" class="form-control" placeholder="Enter folder name"
                       style="margin-top: 8px; display: none;">
            </div>

            <div class="form-actions" style="margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="executeMoveEmails()">Move Emails</button>
            </div>
        `;
    } catch (error) {
        document.getElementById('move-modal-content').innerHTML = `
            <p style="color: var(--danger);">Failed to load folders: ${error.message}</p>
            <div class="form-actions" style="margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
            </div>
        `;
    }
}

function toggleNewFolderInput() {
    const isNew = document.querySelector('input[name="folder-option"]:checked').value === 'new';
    document.getElementById('move-folder-select').style.display = isNew ? 'none' : 'block';
    document.getElementById('new-folder-name').style.display = isNew ? 'block' : 'none';
}

async function executeMoveEmails() {
    const selected = getSelectedSenderEmails();
    const isNew = document.querySelector('input[name="folder-option"]:checked').value === 'new';
    const folderId = isNew ? null : document.getElementById('move-folder-select').value;
    const newFolderName = isNew ? document.getElementById('new-folder-name').value.trim() : null;

    if (isNew && !newFolderName) {
        alert('Please enter a folder name');
        return;
    }

    const btn = document.querySelector('#move-modal-content .btn-primary');
    btn.disabled = true;
    btn.textContent = 'Moving...';

    try {
        const result = await API.bulk.moveEmails(selected, folderId, isNew, newFolderName);
        closeModal();
        alert(`Successfully moved ${result.totalMoved} emails from ${selected.length} sender(s)`);

        // Uncheck all and refresh
        document.querySelectorAll('.sender-checkbox').forEach(cb => cb.checked = false);
        updateBulkActionButtons();
    } catch (error) {
        alert('Failed to move emails: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Move Emails';
    }
}

async function showSegregateConfirm() {
    const selected = getSelectedSenderEmails();
    if (selected.length === 0) {
        alert('Please select at least one sender');
        return;
    }

    // Check which are already segregated
    const alreadySegregated = selected.filter(e => segregatedSenders.has(e.toLowerCase()));
    const newSenders = selected.filter(e => !segregatedSenders.has(e.toLowerCase()));

    let warningHtml = '';
    if (alreadySegregated.length > 0) {
        warningHtml = `
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--warning); border-radius: 6px; padding: 10px; margin-bottom: 15px;">
                <strong style="color: var(--warning);">Note:</strong> ${alreadySegregated.length} sender(s) already segregated.
                Only <strong>new</strong> emails (received since last run) will be moved.
            </div>
        `;
    }

    const content = `
        <div>
            <p style="margin-bottom: 15px;">
                This will create a folder for each of the <strong>${selected.length}</strong> selected sender(s)
                under a "Segregated" parent folder.
            </p>
            ${warningHtml}
            <p style="margin-bottom: 15px; color: var(--text-secondary);">
                Each folder will be named after the sender's email address (before the @).
            </p>
            <ul style="margin: 15px 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">
                ${selected.map(email => {
                    const isOld = segregatedSenders.has(email.toLowerCase());
                    return `<li style="${isOld ? 'color: var(--text-secondary);' : ''}">
                        ${escapeHtml(email)} → Segregated/${escapeHtml(email.split('@')[0])}
                        ${isOld ? '<span style="color: var(--warning);">(update)</span>' : '<span style="color: var(--success);">(new)</span>'}
                    </li>`;
                }).join('')}
            </ul>
            <div class="form-actions" style="margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" id="segregate-confirm-btn" onclick="executeSegregateEmails()">
                    Segregate Emails
                </button>
            </div>
        </div>
    `;
    showModal('Segregate Emails by Sender', content);
}

async function executeSegregateEmails() {
    const selected = getSelectedSenderEmails();

    const btn = document.getElementById('segregate-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Segregating...';

    try {
        const result = await API.bulk.segregateEmails(selected);
        closeModal();

        // Update local segregated set
        selected.forEach(email => segregatedSenders.add(email.toLowerCase()));

        // Show result with details
        const msg = result.totalMoved > 0
            ? `Successfully moved ${result.totalMoved} new emails from ${selected.length} sender(s) to their segregated folders.`
            : `No new emails to move. All ${selected.length} sender(s) were already fully segregated.`;
        alert(msg);

        // Uncheck all and refresh UI to show updated status
        document.querySelectorAll('.sender-checkbox').forEach(cb => cb.checked = false);
        updateBulkActionButtons();

        // Reload analytics to refresh segregation badges
        loadAnalytics();
    } catch (error) {
        alert('Failed to segregate emails: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Segregate Emails';
    }
}
