const PlannerTask = require("../models/plannerTaskModel");
const asyncHandler = require("express-async-handler");

/**
 * Get all planner tasks for the authenticated user
 * Optionally filter by date
 */
const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { date } = req.query;

  let query = { userId };
  
  // If date provided, filter by dueDate
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query.dueDate = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  const tasks = await PlannerTask.find(query).sort({ dueDate: 1, createdAt: -1 });
  res.json(tasks);
});

/**
 * Create a new planner task
 */
const createTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { title, dueDate } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("Title is required");
  }

  if (!dueDate) {
    res.status(400);
    throw new Error("Due date is required");
  }

  const task = await PlannerTask.create({
    userId,
    title,
    dueDate: new Date(dueDate),
    completed: false,
  });

  res.status(201).json(task);
});

/**
 * Update a planner task
 */
const updateTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.id;
  const { title, completed, dueDate } = req.body;

  const task = await PlannerTask.findOne({ _id: taskId, userId });
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (completed !== undefined) updateData.completed = completed;
  if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

  const updatedTask = await PlannerTask.findByIdAndUpdate(
    taskId,
    updateData,
    { new: true }
  );

  res.json(updatedTask);
});

/**
 * Delete a planner task
 */
const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.id;

  const task = await PlannerTask.findOne({ _id: taskId, userId });
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  await PlannerTask.findByIdAndDelete(taskId);
  res.json({ message: "Task deleted successfully" });
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
