const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const {
  fetchUsers,
  getCurrentUser,
  getUserById,
  loginUser,
  signupUser,
} = require("../controllers/userController");
const {
  submitOnboardingForm,
  fetchOnboardingForm,
} = require("../controllers/onBoardingController");
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/authMiddleware");

const validateSignup = (req, res, next) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ message: "email, username and password are required" });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }
  next();
};

router.param("id", (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  next();
});

// Google / GitHub OAuth start routes
// Accept optional `redirect_uri` query param which will be carried in `state`
router.get("/auth/google", (req, res, next) => {
  const redirect = req.query.redirect_uri || process.env.CLIENT_REDIRECT_URI;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: redirect,
  })(req, res, next);
});

router.get("/auth/github", (req, res, next) => {
  const redirect = req.query.redirect_uri || process.env.CLIENT_REDIRECT_URI;
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
    state: redirect,
  })(req, res, next);
});
router.get("/auth/discord", (req, res, next) => {
  const redirect = req.query.redirect_uri || process.env.CLIENT_REDIRECT_URI;
  passport.authenticate("discord", {
    scope: ["identify", "email"],
    session: false,
    state: redirect,
  })(req, res, next);
});

router.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    console.error("Google callback - auth result:", {
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
      const token = jwt.sign({ id: user._id }, secret, { expiresIn });
      // prefer redirect target from provider state, fall back to env
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
        },
      });
    } catch (signErr) {
      console.error("JWT sign error:", signErr);
      res.status(500).json({ message: "Token generation failed" });
    }
  })(req, res, next);
});
router.get("/auth/github/callback", (req, res, next) => {
  passport.authenticate("github", { session: false }, (err, user, info) => {
    console.error("GitHub callback - auth result:", {
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
        },
      });
    } catch (signErr) {
      console.error("JWT sign error:", signErr);
      res.status(500).json({ message: "Token generation failed" });
    }
  })(req, res, next);
});
router.get("/auth/discord/callback", (req, res, next) => {
  passport.authenticate("discord", { session: false }, (err, user, info) => {
    console.error("Discord callback - auth result:", {
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
      const token = jwt.sign({ id: user._id }, secret, { expiresIn });
      const redirectTarget = req.query.state || process.env.CLIENT_REDIRECT_URI;
      if (redirectTarget) {
        const sep = redirectTarget.includes("?") ? "&" : "?";
        return;
        res.redirect(`${redirectTarget}${sep}token=${token}`);
      }
      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      });
    } catch (signErr) {
      console.error("JWT sign error:", signErr);
      res.status(500).json({ message: "Token generation failed" });
    }
  })(req, res, next);
});
// Google / GitHub OAuth end routes
router.get("/onBoardingForm", (req, res) => {
  res.send("onBoardingForm route is working");
});

// Onboarding form routes
router.post("/onboarding", requireAuth, submitOnboardingForm);
router.get("/onboarding", requireAuth, fetchOnboardingForm);

router.post("/signup", validateSignup, signupUser);
router.post("/", validateSignup, signupUser); // alias for backwards-compat
router.post("/login", validateLogin, loginUser);
router.get("/", fetchUsers);
router.get("/me", requireAuth, getCurrentUser);
router.get("/:id", getUserById);

module.exports = router;
