const OnboardingForm = require("../models/onBoardingForm");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");

// submit form
const submitOnboardingForm = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Debug: Log the request body
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  const {
    role,
    wakeUpTime,
    sleepInconsistent,
    currentHabits,
    consistencyLevel,
    dailyFreeTime,
    focusArea,
  } = req.body;

  // Validate required fields - check for both existence and non-empty strings
  if (!role || typeof role !== 'string' || role.trim() === '') {
    res.status(400);
    throw new Error("Role is required and must be a non-empty string");
  }
  if (!focusArea || typeof focusArea !== 'string' || focusArea.trim() === '') {
    res.status(400);
    throw new Error("focusArea is required and must be a non-empty string");
  }

  // Check if form already submitted
  const existingForm = await OnboardingForm.findOne({ user_id: userId });
  if (existingForm) {
    res.status(400);
    throw new Error("Onboarding form already submitted");
  }

  try {
    const form = await OnboardingForm.create({
      user_id: userId,
      role: role.trim(),
      wakeUpTime: wakeUpTime || undefined,
      sleepInconsistent: sleepInconsistent !== undefined ? sleepInconsistent : false,
      currentHabits: currentHabits || [],
      consistencyLevel: consistencyLevel || undefined,
      dailyFreeTime: dailyFreeTime || undefined,
      focusArea: focusArea.trim(),
    });
    
    if (form) {
      // Update user's filledForm status to true
      await User.findByIdAndUpdate(userId, { filledForm: true });
      res.status(201).json({ message: "Onboarding form submitted successfully" });
    } else {
      res.status(400);
      throw new Error("Invalid form data");
    }
  } catch (error) {
    console.error("Error creating onboarding form:", error);
    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(", ");
      res.status(400);
      throw new Error(`Validation error: ${validationErrors}`);
    }
    throw error;
  }
});
const fetchOnboardingForm = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const form = await OnboardingForm.findOne({ user_id: userId }).select(
    "-__v -createdAt -updatedAt -_id -user_id"
  );
  if (form) {
    res.status(200).json(form);
  } else {
    res.status(404);
    throw new Error("Onboarding form not found");
  }
});

module.exports = {
  submitOnboardingForm,
  fetchOnboardingForm,
};
