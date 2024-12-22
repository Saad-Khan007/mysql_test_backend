// Import required modules
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

// Validate environment variables
['DATABASE_HOST', 'DATABASE_USERNAME', 'DATABASE_PASSWORD', 'DATABASE_NAME'].forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Middleware to test database connection
app.use(async (req, res, next) => {
    try {
        await pool.query('SELECT 1'); // Simple query to ensure DB is reachable
        next();
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ error: 'Unable to connect to the database' });
    }
});

// Ensure "todos" table exists
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT false
            )
        `);
        console.log('Todos table ensured');
    } catch (err) {
        console.error('Error ensuring todos table:', err);
    }
})();

// CRUD API Endpoints

// Create a new to-do
app.post('/todos', async (req, res) => {
    const { task } = req.body;
    if (!task) {
        return res.status(400).json({ error: 'Task is required' });
    }
    try {
        const [result] = await pool.query('INSERT INTO todos (task) VALUES (?)', [task]);
        res.status(201).json({ id: result.insertId, task, completed: false });
    } catch (err) {
        console.error('Error inserting task:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Read all to-dos
app.get('/todos', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM todos');
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a to-do
app.put('/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { task, completed } = req.body;
    if (task === undefined || completed === undefined) {
        return res.status(400).json({ error: 'Task and completed status are required' });
    }
    try {
        const [result] = await pool.query('UPDATE todos SET task = ?, completed = ? WHERE id = ?', [task, completed, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({ message: 'Task updated' });
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a to-do
app.delete('/todos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM todos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({ message: 'Task deleted' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
