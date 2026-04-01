/**
 * Crazy Casino - VIP
 */

document.addEventListener('DOMContentLoaded', () => {
    const t = localStorage.getItem('token');
    if (!t) { window.location.href = '/'; return; }

    try {
        const p = JSON.parse(atob(t.split('.')[1]));
        if (!p.lvl || p.lvl < 3) {
            document.getElementById('status-content').innerHTML = '<div class="status-indicator denied">Access Denied</div>';
            return;
        }
    } catch (e) { window.location.href = '/'; return; }

    init();
});

async function init() {
    try {
        await apiCall('/api/m/info');
        document.getElementById('status-content').innerHTML = '<div class="status-indicator granted">Welcome</div>';
        document.getElementById('vip-search').classList.remove('hidden');
        document.getElementById('vault-section').classList.remove('hidden');
    } catch (e) {
        document.getElementById('status-content').innerHTML = '<div class="status-indicator denied">Error</div>';
    }
    document.getElementById('search-btn').addEventListener('click', doSearch);
    document.getElementById('vault-info-btn').addEventListener('click', vaultInfo);
    document.getElementById('withdraw-btn').addEventListener('click', vaultProcess);
}

async function doSearch() {
    const v = document.getElementById('search-username').value;
    const r = document.getElementById('search-results');
    try {
        await apiCall('/api/m/q', { method: 'POST', body: JSON.stringify({ u: v || null }) });
        r.innerHTML = 'Done';
    } catch (e) { r.innerHTML = '-'; }
}

async function vaultInfo() {
    const r = document.getElementById('vault-info');
    try {
        await apiCall('/api/t/info');
        r.innerHTML = 'Ready';
        document.getElementById('vault-withdraw').classList.remove('hidden');
    } catch (e) { r.innerHTML = '-'; }
}

async function vaultProcess() {
    const v = document.getElementById('withdraw-data').value;
    const r = document.getElementById('withdraw-result');
    try {
        const d = await apiCall('/api/t/process', { method: 'POST', body: JSON.stringify({ d: v }) });
        r.innerHTML = d.s || '-';
    } catch (e) { r.innerHTML = '-'; }
}
