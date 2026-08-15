const express = require("express");
const { pool } = require("../db");
const { verifyToken, isAdmin } = require("../middleware");

const router = express.Router();

// Every route below requires a valid token AND role === 'admin'.
// This is checked on the server — the /admin URL on the frontend
// is just a page; this middleware is what actually protects the data.
router.use(verifyToken, isAdmin);

router.get("/stats", async (req, res) => {
  const [[{ ordersToday }]] = await pool.query(
    "SELECT COUNT(*) AS ordersToday FROM orders WHERE DATE(created_at) = CURDATE()"
  );
  const [[{ revenueToday }]] = await pool.query(
    "SELECT COALESCE(SUM(total),0) AS revenueToday FROM orders WHERE DATE(created_at) = CURDATE()"
  );
  const [[{ productCount }]] = await pool.query("SELECT COUNT(*) AS productCount FROM products");
  const [[{ userCount }]] = await pool.query("SELECT COUNT(*) AS userCount FROM users WHERE role='customer'");

  const [recentOrders] = await pool.query(`
    SELECT orders.id, users.name AS customer, orders.total, orders.status
    FROM orders JOIN users ON orders.user_id = users.id
    ORDER BY orders.created_at DESC LIMIT 10
  `);

  res.json({ ordersToday, revenueToday, productCount, userCount, recentOrders });
});

module.exports = router;
