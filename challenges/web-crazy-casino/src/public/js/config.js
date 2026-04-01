/**
 * Crazy Casino - Config
 */

const CONFIG = {
    API_BASE: '',
    VERSION: '1.0.0'
};

// Debug mode - set header x-debug-mode:true for internal endpoints
const DEBUG = false;

function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers
    };

    const response = await fetch(endpoint, {
        ...options,
        headers
    });

    return response.json();
}
