const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization ||
      req.query.token ||
      req.headers["x-access-token"];
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    let token = authHeader;
    if (authHeader.startsWith && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    const secret = process.env.JWT_SECRET;
    if (!secret)
      return res.status(500).json({ message: "JWT_SECRET not configured" });
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.id)
      return res.status(401).json({ message: "Invalid token" });
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = { requireAuth };
