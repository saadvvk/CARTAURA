const express = require("express");
const { pool } = require("../db");
const { verifyToken, isAdmin } = require("../middleware");

const router = express.Router();

// Public — anyone can view products
router.get("/", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(rows[0]);
});

// Admin only — add a product
router.post("/", verifyToken, isAdmin, async (req, res) => {
  const { name, description, price, stock, image, on_sale } = req.body;
  const [result] = await pool.query(
    "INSERT INTO products (name, description, price, stock, image, on_sale) VALUES (?, ?, ?, ?, ?, ?)",
    [name, description, price, stock || 0, image || null, !!on_sale]
  );
  res.json({ id: result.insertId });
});

// Admin only — edit a product
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  const { name, description, price, stock, image, on_sale } = req.body;
  await pool.query(
    "UPDATE products SET name=?, description=?, price=?, stock=?, image=?, on_sale=? WHERE id=?",
    [name, description, price, stock, image, !!on_sale, req.params.id]
  );
  res.json({ message: "Updated" });
});

// Admin only — delete a product
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
  res.json({ message: "Deleted" });
});

module.exports = router;
