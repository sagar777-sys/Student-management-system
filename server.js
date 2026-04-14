const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// DATABASE CONNECTION
const db = new sqlite3.Database(path.join(__dirname, "students.db"), (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// CREATE TABLES
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      course TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

/* AUTH */

// REGISTER
app.post("/api/register", (req, res) => {
  const fullName = (req.body.fullName || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();
  const phone = (req.body.phone || "").trim();
  const password = (req.body.password || "").trim();

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  const phoneRegex = /^\d{10}$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
  }

  const sql = `
    INSERT INTO users (full_name, email, phone, password)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [fullName, email, phone, password], function (err) {
    if (err) {
      console.error("Register error:", err.message);

      if (err.message.includes("users.email")) {
        return res.status(400).json({ error: "Email already registered" });
      }

      if (err.message.includes("users.phone")) {
        return res.status(400).json({ error: "Phone already registered" });
      }

      return res.status(500).json({ error: "Registration failed" });
    }

    return res.json({
      message: "Registration successful",
      userId: this.lastID
    });
  });
});

// LOGIN
app.post("/api/login", (req, res) => {
  const loginId = (req.body.loginId || "").trim().toLowerCase();
  const password = (req.body.password || "").trim();

  if (!loginId || !password) {
    return res.status(400).json({ error: "Email/phone and password are required" });
  }

  const sql = `
    SELECT * FROM users
    WHERE (LOWER(email) = ? OR phone = ?) AND password = ?
  `;

  db.get(sql, [loginId, loginId, password], (err, user) => {
    if (err) {
      console.error("Login error:", err.message);
      return res.status(500).json({ error: "Login failed" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone
      }
    });
  });
});

/* STUDENTS */

// GET STUDENTS
app.get("/api/students/:userId", (req, res) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const sql = `
    SELECT * FROM students
    WHERE user_id = ?
    ORDER BY id DESC
  `;

  db.all(sql, [userId], (err, students) => {
    if (err) {
      console.error("Fetch students error:", err.message);
      return res.status(500).json({ error: "Fetch failed" });
    }

    return res.json(students);
  });
});

// ADD STUDENT
app.post("/api/students", (req, res) => {
  const userId = Number(req.body.userId);
  const name = (req.body.name || "").trim();
  const age = Number(req.body.age);
  const course = (req.body.course || "").trim();
  const phone = (req.body.phone || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();

  if (!userId || !name || !age || !course || !phone || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO students (user_id, name, age, course, phone, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [userId, name, age, course, phone, email], function (err) {
    if (err) {
      console.error("Add student error:", err.message);
      return res.status(500).json({ error: "Insert failed" });
    }

    return res.json({
      message: "Student added",
      id: this.lastID
    });
  });
});

// UPDATE STUDENT
app.put("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.body.userId);
  const name = (req.body.name || "").trim();
  const age = Number(req.body.age);
  const course = (req.body.course || "").trim();
  const phone = (req.body.phone || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();

  if (!id || !userId || !name || !age || !course || !phone || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    UPDATE students
    SET name = ?, age = ?, course = ?, phone = ?, email = ?
    WHERE id = ? AND user_id = ?
  `;

  db.run(sql, [name, age, course, phone, email, id, userId], function (err) {
    if (err) {
      console.error("Update student error:", err.message);
      return res.status(500).json({ error: "Update failed" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    return res.json({ message: "Updated" });
  });
});

// DELETE STUDENT
app.delete("/api/students/:id/:userId", (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.params.userId);

  if (!id || !userId) {
    return res.status(400).json({ error: "Invalid request" });
  }

  db.run(
    `DELETE FROM students WHERE id = ? AND user_id = ?`,
    [id, userId],
    function (err) {
      if (err) {
        console.error("Delete student error:", err.message);
        return res.status(500).json({ error: "Delete failed" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.json({ message: "Deleted" });
    }
  );
});

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});