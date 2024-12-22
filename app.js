// Import required modules
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Create MySQL connection
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME, // Replace with your MySQL username
    password: process.env.DATABASE_PASSWORD, // Replace with your MySQL password
    database: process.env.DATABASE_NAME // Replace with your MySQL database name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Create table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT false
  )
`, (err) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Todos table ensured');
    }
});

// CRUD API Endpoints

// Create a new to-do
app.post('/todos', (req, res) => {
    const { task } = req.body;
    if (!task) {
        return res.status(400).send('Task is required');
    }
    const query = 'INSERT INTO todos (task) VALUES (?)';
    db.query(query, [task], (err, result) => {
        if (err) {
            console.error('Error inserting task:', err);
            return res.status(500).send('Server error');
        }
        res.status(201).json({ id: result.insertId, task, completed: false });
    });
});

// Read all to-dos
app.get('/todos', (req, res) => {
    const query = 'SELECT * FROM todos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).send('Server error');
        }
        res.status(200).json(results);
    });
});

// Update a to-do
app.put('/todos/:id', (req, res) => {
    const { id } = req.params;
    const { task, completed } = req.body;
    const query = 'UPDATE todos SET task = ?, completed = ? WHERE id = ?';
    db.query(query, [task, completed, id], (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).send('Server error');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Task not found');
        }
        res.status(200).send('Task updated');
    });
});

// Delete a to-do
app.delete('/todos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM todos WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).send('Server error');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Task not found');
        }
        res.status(200).send('Task deleted');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
