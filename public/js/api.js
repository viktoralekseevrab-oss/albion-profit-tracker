const API_BASE = '/api';

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };
    const res = await fetch(API_BASE + url, { ...options, headers });
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('token');
            showAuth();
            throw new Error('Unauthorized');
        }
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}