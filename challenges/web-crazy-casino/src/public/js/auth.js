/**
 * Crazy Casino - Authentication
 */

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${target}-form`).classList.add('active');
        });
    });

    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const messageDiv = document.getElementById('login-message');

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.token) {
                localStorage.setItem('token', data.token);
                messageDiv.className = 'message success';
                messageDiv.textContent = 'Welcome!';
                setTimeout(() => window.location.href = '/dashboard', 1000);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Login failed';
            }
        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Connection error';
        }
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const messageDiv = document.getElementById('register-message');

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.id || data.success) {
                messageDiv.className = 'message success';
                messageDiv.textContent = 'Account created!';
                setTimeout(() => {
                    document.querySelector('[data-tab="login"]').click();
                }, 1500);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Registration failed';
            }
        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Connection error';
        }
    });

    // Check if already logged in
    if (localStorage.getItem('token')) {
        window.location.href = '/dashboard';
    }
});
