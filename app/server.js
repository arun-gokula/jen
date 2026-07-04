const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'change-this-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
}));

let pool;

// Retry DB connection until MySQL container is ready
async function connectWithRetry() {
    for (let i = 0; i < 15; i++) {
        try {
            pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || 'rootpass',
                database: process.env.DB_NAME || 'userdb',
                waitForConnections: true,
                connectionLimit: 10
            });
            await pool.query('SELECT 1');
            console.log('Connected to database.');
            return;
        } catch (err) {
            console.log(`DB not ready yet, retrying (${i + 1}/15)...`);
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    console.error('Could not connect to database after retries.');
}
connectWithRetry();

// Signup
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required.' });
    }
    try {
        const hashed = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
        res.json({ message: 'Account created successfully.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already taken.' });
        }
        res.status(500).json({ error: 'Server error.' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const valid = await bcrypt.compare(password, rows[0].password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        req.session.user = username;
        res.json({ message: 'Login successful.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// Check session
app.get('/api/me', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.status(401).json({ error: 'Not logged in.' });
    }
});

// Logout
app.get('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ message: 'Logged out.' }));
});

app.listen(3000, () => console.log('App running on port 3000'));