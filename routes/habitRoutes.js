const express = require("express");
const router = express.Router();
const {
  getHabits,
  completeHabit,
  createHabit,
} = require("../controllers/habitController");
const { requireAuth } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(requireAuth);

// Get all habits for the authenticated user
router.get("/", getHabits);

// Create a new habit (optional, for manual addition)
router.post("/", createHabit);

// Complete a habit and award points
router.post("/:id/complete", completeHabit);

module.exports = router;
