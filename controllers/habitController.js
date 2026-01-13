const Habit = require("../models/habitModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

/**
 * Get all habits for the authenticated user
 */
const getHabits = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const habits = await Habit.find({ userId, isActive: true }).sort({
    createdAt: -1,
  });
  res.json(habits);
});

/**
 * Complete a habit and award points
 */
const completeHabit = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const habitId = req.params.id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    res.status(404);
    throw new Error("Habit not found");
  }

  if (!habit.isActive) {
    res.status(400);
    throw new Error("Habit is not active");
  }

  // Award points to user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const pointsToAdd = habit.points || 10;
  const newPoints = user.points + pointsToAdd;
  
  // Calculate level (level up every 100 points)
  const newLevel = Math.floor(newPoints / 100) + 1;

  await User.findByIdAndUpdate(userId, {
    points: newPoints,
    level: newLevel,
  });

  res.json({
    message: "Habit completed",
    pointsAwarded: pointsToAdd,
    totalPoints: newPoints,
    level: newLevel,
  });
});

/**
 * Create a habit (for manual addition, if needed)
 */
const createHabit = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { title, description, schedule, points } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("Title is required");
  }

  const habit = await Habit.create({
    userId,
    title,
    description: description || "",
    schedule: schedule || "daily",
    points: points || 10,
    isActive: true,
  });

  res.status(201).json(habit);
});

module.exports = {
  getHabits,
  completeHabit,
  createHabit,
};
