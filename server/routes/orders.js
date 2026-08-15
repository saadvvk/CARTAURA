const express = require("express");
const { pool } = require("../db");
const { verifyToken } = require("../middleware");

const router = express.Router();

// Logged-in user places an order
router.post("/", verifyToken, async (req, res) => {
  const { items } = req.body; // [{ id, price, qty }]
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'pending')",
      [req.user.id, total]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)",
        [orderId, item.id, item.qty, item.price]
      );
    }

    await conn.commit();
    res.json({ orderId, total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Order failed", error: err.message });
  } finally {
    conn.release();
  }
});

// Logged-in user's own order history
router.get("/mine", verifyToken, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  res.json(rows);
});

module.exports = router;
