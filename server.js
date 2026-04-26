const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Create/Open the SQLite database file
const db = new sqlite3.Database('./sudoku.db');

// Create the table if it doesn't exist
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS leaderboard (id INTEGER PRIMARY KEY, name TEXT, time INTEGER)");
});

// Route to get Top 10
app.get('/scores', (req, res) => {
    db.all("SELECT name, time FROM leaderboard ORDER BY time ASC LIMIT 10", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// Route to save a new score
app.post('/save-score', (req, res) => {
    const { name, time } = req.body;
    db.run("INSERT INTO leaderboard (name, time) VALUES (?, ?)", [name, time], function(err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID });
    });
});

app.listen(3000, () => console.log('SQL Leaderboard running on http://localhost:3000'));