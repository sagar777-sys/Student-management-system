const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ✅ NEW DATABASE (better-sqlite3)
const db = new Database(path.join(__dirname, "students.db"));

console.log("Connected to SQLite database");

// CREATE TABLES
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    course TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL
  )
`).run();

/* AUTH */

// REGISTER
app.post("/api/register", (req, res) => {
  try {
    const fullName = req.body.fullName.trim();
    const email = req.body.email.trim().toLowerCase();
    const phone = req.body.phone.trim();
    const password = req.body.password.trim();

    const stmt = db.prepare(`
      INSERT INTO users (full_name, email, phone, password)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(fullName, email, phone, password);

    res.json({
      message: "Registration successful",
      userId: result.lastInsertRowid
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN
app.post("/api/login", (req, res) => {
  try {
    const loginId = req.body.loginId.trim().toLowerCase();
    const password = req.body.password.trim();

    const user = db.prepare(`
      SELECT * FROM users
      WHERE (LOWER(email) = ? OR phone = ?) AND password = ?
    `).get(loginId, loginId, password);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user
    });

  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* STUDENTS */

// GET
app.get("/api/students/:userId", (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const students = db.prepare(`
      SELECT * FROM students WHERE user_id = ? ORDER BY id DESC
    `).all(userId);

    res.json(students);

  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// ADD
app.post("/api/students", (req, res) => {
  try {
    const { userId, name, age, course, phone, email } = req.body;

    const result = db.prepare(`
      INSERT INTO students (user_id, name, age, course, phone, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name, age, course, phone, email);

    res.json({
      message: "Student added",
      id: result.lastInsertRowid
    });

  } catch (err) {
    res.status(500).json({ error: "Insert failed" });
  }
});

// UPDATE
app.put("/api/students/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { userId, name, age, course, phone, email } = req.body;

    const result = db.prepare(`
      UPDATE students
      SET name=?, age=?, course=?, phone=?, email=?
      WHERE id=? AND user_id=?
    `).run(name, age, course, phone, email, id, userId);

    res.json({ message: "Updated" });

  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE
app.delete("/api/students/:id/:userId", (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.params.userId);

    db.prepare(`
      DELETE FROM students WHERE id=? AND user_id=?
    `).run(id, userId);

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});