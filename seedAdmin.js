// Run this ONCE after your database is connected:
//   npm run seed:admin
// It reads ADMIN_EMAIL / ADMIN_PASSWORD from .env and creates
// the one and only admin account. No signup form ever creates an admin —
// this is the only way an 'admin' role gets into the database.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, initDb } = require("./db");

async function seedAdmin() {
  await initDb();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env first.");
    process.exit(1);
  }

  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) {
    console.log("Admin already exists for this email. Nothing changed.");
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
    ["Admin", email, hash]
  );

  console.log(`Admin account created: ${email}`);
  process.exit(0);
}

seedAdmin();
