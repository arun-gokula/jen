async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');

    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
        msg.textContent = data.message + ' Redirecting to login...';
        msg.className = 'message success';
        setTimeout(() => window.location.href = 'login.html', 1200);
    } else {
        msg.textContent = data.error;
        msg.className = 'message error';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
        msg.textContent = 'Login successful! Redirecting...';
        msg.className = 'message success';
        setTimeout(() => window.location.href = 'dashboard.html', 800);
    } else {
        msg.textContent = data.error;
        msg.className = 'message error';
    }
}

async function loadDashboard() {
    const res = await fetch('/api/me');
    if (!res.ok) {
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    document.getElementById('welcomeUser').textContent = `Welcome, ${data.username}!`;
}

async function logout() {
    await fetch('/api/logout');
    window.location.href = 'login.html';
}