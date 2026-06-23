function showAuth() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
}

async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!username || !password) return alert('Введите имя и пароль');
    try {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        localStorage.setItem('token', data.token);
        showApp();
        await initApp();
    } catch (e) {
        alert(e.message);
    }
}

async function register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!username || !password) return alert('Введите имя и пароль');
    try {
        await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        alert('Регистрация успешна. Теперь войдите.');
    } catch (e) {
        alert(e.message);
    }
}

// Никакого автоматического вызова здесь нет – он в app.js