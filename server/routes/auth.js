const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ---- Signup (always creates role = 'customer', never 'admin') ----
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')",
      [name, email, hash]
    );

    const user = { id: result.insertId, name, email, role: "customer" };
    res.json({ token: makeToken(user), user });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// ---- Login (works for both customer and admin — role comes from DB) ----
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ token: makeToken(safeUser), user: safeUser });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// ---- Google OAuth ----
// Full Google login needs the 'passport' + 'passport-google-oauth20' packages
// and a Google Cloud OAuth client. Left as a clear next step so the core
// email/password + admin security works first. Ask me when you're ready
// and I'll wire this route up completely.
router.get("/google", (req, res) => {
  res.status(501).json({ message: "Google login not wired up yet" });
});

module.exports = router;
     
