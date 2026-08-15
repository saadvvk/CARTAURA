const jwt = require("jsonwebtoken");

// Checks the Bearer token is valid, attaches user info to req.user
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Must run AFTER verifyToken — rejects anyone whose role isn't admin.
// This is the real security check: it runs on the server, so no
// frontend trick (editing localStorage, guessing /admin urls) can bypass it.
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}

module.exports = { verifyToken, isAdmin };
