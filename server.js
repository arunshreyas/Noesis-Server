require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 3000;
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const onBoardingFormRoutes = require("./routes/onBoardingFormRoutes");
const habitRoutes = require("./routes/habitRoutes");
const plannerRoutes = require("./routes/plannerRoutes");
const passport = require("./config/passport");

connectDB();

app.use(express.json());
app.use(passport.initialize());

app.use("/", express.static(path.join(__dirname, "./public")));

app.use("/", require("./routes/root"));
app.use("/users", userRoutes);
app.use("/users", onBoardingFormRoutes);
app.use("/habits", habitRoutes);
app.use("/planner", plannerRoutes);
// convenience redirect in case someone hits /auth/google directly
app.get("/auth/google", (req, res) => res.redirect("/users/auth/google"));
// Handle top-level callback (if Google console uses /auth/google/callback)
app.get("/auth/google/callback", (req, res, next) => {
  const { awardLoginPoints } = require("./controllers/userController");
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    console.error("Top-level Google callback - auth result:", {
      err: err && err.message,
      info,
    });
    if (err)
      return res
        .status(500)
        .json({ message: "OAuth error", error: err && err.message, info });
    if (!user) return res.redirect("/");
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "30d";
    if (!secret)
      return res.status(500).json({ message: "JWT_SECRET not configured" });
    try {
      // Award login points
      const { points, level } = await awardLoginPoints(user._id);
      
      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ id: user._id }, secret, { expiresIn });
      const redirectTarget = req.query.state || process.env.CLIENT_REDIRECT_URI;
      if (redirectTarget) {
        const sep = redirectTarget.includes("?") ? "&" : "?";
        return res.redirect(`${redirectTarget}${sep}token=${token}`);
      }
      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          points,
          level,
        },
      });
    } catch (signErr) {
      console.error("JWT sign error:", signErr);
      res.status(500).json({ message: "Token generation failed" });
    }
  })(req, res, next);
});
app.get("/auth/discord", (req, res) => res.redirect("/users/auth/discord"));
app.get("/auth/discord/callback", (req, res, next) => {
  const { awardLoginPoints } = require("./controllers/userController");
  passport.authenticate("discord", { session: false }, async (err, user, info) => {
    console.error("Top-level Discord callback - auth result:", {
      err: err && err.message,
      info,
    });
    if (err)
      return res
        .status(500)
        .json({ message: "OAuth error", error: err && err.message, info });
    if (!user) return res.redirect("/");
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "30d";
    if (!secret)
      return res.status(500).json({ message: "JWT_SECRET not configured" });
    try {
      // Award login points
      const { points, level } = await awardLoginPoints(user._id);
      
      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ id: user._id }, secret, { expiresIn });
      const redirectTarget = req.query.state || process.env.CLIENT_REDIRECT_URI;
      if (redirectTarget) {
        const sep = redirectTarget.includes("?") ? "&" : "?";
        return res.redirect(`${redirectTarget}${sep}token=${token}`);
      }
      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          points,
          level,
        },
      });
    } catch (signErr) {
      console.error("JWT sign error:", signErr);
      res.status(500).json({ message: "Token generation failed" });
    }
  })(req, res, next);
});
app.get("/auth/github", (req, res) => res.redirect("/users/auth/github"));
app.get("/auth/github/callback", (req, res) =>
  res.redirect("/auth/github/callback")
);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? {} : err.stack,
  });
});

app.use((req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB");
  });
  mongoose.connection.on("error", (err) => {
    console.log(err);
  });
});
