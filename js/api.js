/**
 * API Client for Email Utilities Backend
 */
const API = {
    baseUrl: 'http://localhost:8080/api',

    // Current user ID (loaded from localStorage)
    currentUserId: localStorage.getItem('emailutils-user-id') || '1',

    // Default headers
    headers: {
        'Content-Type': 'application/json',
    },

    // Set auth credentials (Basic auth for development)
    setAuth(username, password) {
        this.headers['Authorization'] = 'Basic ' + btoa(username + ':' + password);
    },

    // Set current user ID
    setUserId(userId) {
        this.currentUserId = userId;
        localStorage.setItem('emailutils-user-id', userId);
    },

    // Generic fetch wrapper
    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const config = {
            ...options,
            headers: {
                ...this.headers,
                'X-User-Id': this.currentUserId,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // GET request
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    // POST request
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // PUT request
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // DELETE request
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // Health check
    health() {
        return this.get('/health');
    },

    // ============ Users ============
    users: {
        list() {
            return API.get('/users');
        },
        get(id) {
            return API.get(`/users/${id}`);
        },
    },

    // ============ Email Accounts ============
    accounts: {
        list() {
            return API.get('/accounts');
        },
        get(id) {
            return API.get(`/accounts/${id}`);
        },
        create(data) {
            return API.post('/accounts', data);
        },
        update(id, data) {
            return API.put(`/accounts/${id}`, data);
        },
        delete(id) {
            return API.delete(`/accounts/${id}`);
        },
        sync(id) {
            return API.post(`/accounts/${id}/sync`);
        },
        getEmails(id, maxResults = 20, pageToken = null, before = null, after = null) {
            let url = `/accounts/${id}/emails?maxResults=${maxResults}`;
            if (pageToken) {
                url += `&pageToken=${encodeURIComponent(pageToken)}`;
            }
            if (before) {
                url += `&before=${encodeURIComponent(before)}`;
            }
            if (after) {
                url += `&after=${encodeURIComponent(after)}`;
            }
            return API.get(url);
        },
        getEmail(accountId, messageId) {
            return API.get(`/accounts/${accountId}/emails/${messageId}`);
        },
        getFolders(id) {
            return API.get(`/accounts/${id}/folders`);
        },
        getEmailsByFolder(id, folderId, maxResults = 20) {
            return API.get(`/accounts/${id}/folders/${encodeURIComponent(folderId)}/emails?maxResults=${maxResults}`);
        },
        moveEmail(accountId, messageId, toFolderId, fromFolderId = null) {
            return API.post(`/accounts/${accountId}/emails/${messageId}/move`, { toFolderId, fromFolderId });
        },
    },

    // ============ Email Lists ============
    lists: {
        list(type = null) {
            const query = type ? `?type=${type}` : '';
            return API.get(`/lists${query}`);
        },
        get(id) {
            return API.get(`/lists/${id}`);
        },
        create(data) {
            return API.post('/lists', data);
        },
        addEntry(listId, data) {
            return API.post(`/lists/${listId}/entries`, data);
        },
        removeEntry(listId, entryId) {
            return API.delete(`/lists/${listId}/entries/${entryId}`);
        },
    },

    // ============ Rules ============
    rules: {
        list() {
            return API.get('/rules');
        },
        get(id) {
            return API.get(`/rules/${id}`);
        },
        create(data) {
            return API.post('/rules', data);
        },
        update(id, data) {
            return API.put(`/rules/${id}`, data);
        },
        delete(id) {
            return API.delete(`/rules/${id}`);
        },
        toggle(id, enabled) {
            return API.put(`/rules/${id}/toggle`, { enabled });
        },
    },

    // ============ Contacts ============
    contacts: {
        listGroups() {
            return API.get('/contacts/lists');
        },
        getGroup(id) {
            return API.get(`/contacts/lists/${id}`);
        },
        createGroup(data) {
            return API.post('/contacts/lists', data);
        },
        addContact(listId, data) {
            return API.post(`/contacts/lists/${listId}/contacts`, data);
        },
        removeContact(listId, contactId) {
            return API.delete(`/contacts/lists/${listId}/contacts/${contactId}`);
        },
    },

    // ============ Analytics ============
    analytics: {
        getAll(limit = 10, days = null) {
            let url = `/analytics?limit=${limit}`;
            if (days) url += `&days=${days}`;
            return API.get(url);
        },
        startSync() {
            return API.post('/analytics/sync', {});
        },
        getSyncStatus() {
            return API.get('/analytics/sync/status');
        },
        getJobStatus(jobId) {
            return API.get(`/analytics/sync/job/${jobId}`);
        },
        cancelSync(jobId) {
            return API.post(`/analytics/sync/cancel/${jobId}`, {});
        },
        getSummary() {
            return API.get('/analytics/summary');
        },
        getTopSenders(limit = 20, days = null) {
            let url = `/analytics/top-senders?limit=${limit}`;
            if (days) url += `&days=${days}`;
            return API.get(url);
        },
        getUnreadBySender(limit = 20) {
            return API.get(`/analytics/unread-by-sender?limit=${limit}`);
        },
        getReplyRanking(limit = 20) {
            return API.get(`/analytics/reply-ranking?limit=${limit}`);
        },
        getLowReplyRatio(limit = 20) {
            return API.get(`/analytics/low-reply-ratio?limit=${limit}`);
        },
    },

    // ============ Notifications ============
    notifications: {
        getAll() {
            return API.get('/notifications');
        },
        getUnread() {
            return API.get('/notifications/unread');
        },
        getUnreadCount() {
            return API.get('/notifications/unread/count');
        },
        markAsRead(id) {
            return API.post(`/notifications/${id}/read`, {});
        },
        markAllAsRead() {
            return API.post('/notifications/read-all', {});
        },
        delete(id) {
            return API.delete(`/notifications/${id}`);
        },
    },

    // ============ Inbox ============
    inbox: {
        list(accountId = null, folder = 'INBOX', page = 0, size = 50) {
            let query = `?folder=${folder}&page=${page}&size=${size}`;
            if (accountId) query += `&accountId=${accountId}`;
            return API.get(`/inbox${query}`);
        },
        getFolders(accountId) {
            return API.get(`/accounts/${accountId}/folders`);
        },
    },

    // ============ Spam Check (Spamhaus) ============
    spam: {
        checkEmail(email) {
            return API.get(`/spam/check/email?email=${encodeURIComponent(email)}`);
        },
        checkDomain(domain) {
            return API.get(`/spam/check/domain?domain=${encodeURIComponent(domain)}`);
        },
        checkIp(ip) {
            return API.get(`/spam/check/ip?ip=${encodeURIComponent(ip)}`);
        },
        checkEmails(emails) {
            return API.post('/spam/check/emails', emails);
        },
        getCacheStats() {
            return API.get('/spam/cache/stats');
        },
        clearCache() {
            return API.post('/spam/cache/clear', {});
        },
    },

    // ============ Bulk Email Operations ============
    bulk: {
        getFolders() {
            return API.get('/bulk/folders');
        },
        moveEmails(senderEmails, folderId, createNew = false, newFolderName = null) {
            return API.post('/bulk/move', {
                senderEmails,
                folderId,
                createNew,
                newFolderName
            });
        },
        segregateEmails(senderEmails) {
            return API.post('/bulk/segregate', { senderEmails });
        },
        getSegregatedSenders() {
            return API.get('/bulk/segregated');
        },
    },
};

// Set default auth for development
API.setAuth('admin', 'admin123');
