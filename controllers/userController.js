const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Please set JWT_SECRET in your .env file"
    );
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "30d";
  return jwt.sign({ id }, secret, { expiresIn });
};

/**
 * Award login points if user hasn't logged in today
 * Returns updated points and level
 */
const awardLoginPoints = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return { points: 0, level: 1 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
  const lastLoginDate = lastLogin ? new Date(lastLogin.setHours(0, 0, 0, 0)) : null;

  let updatedPoints = user.points || 0;
  let updatedLevel = user.level || 1;

  // Award 5 points for daily login if not logged in today
  if (!lastLoginDate || lastLoginDate.getTime() !== today.getTime()) {
    updatedPoints += 5;
    // Calculate level (level up every 100 points)
    updatedLevel = Math.floor(updatedPoints / 100) + 1;

    await User.findByIdAndUpdate(userId, {
      points: updatedPoints,
      level: updatedLevel,
      lastLoginDate: new Date(),
    });
  }

  return { points: updatedPoints, level: updatedLevel };
};

//fetch users
const fetchUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-passwordHash");
  if (!users?.length) {
    res.status(404).json({ message: "No users found" });
  }
  res.json(users);
});

//get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({
    user: {
      ...user.toObject(),
      profile_picture: user.profile_picture,
      points: user.points || 0,
      level: user.level || 1,
    },
  });
});

//get user by id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({
    user: {
      ...user.toObject(),
      profile_picture: user.profile_picture,
    },
  });
});

//login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    // Check if user hasn't logged in today - award login points
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastLogin = user.lastLoginDate
      ? new Date(user.lastLoginDate)
      : null;
    const lastLoginDate = lastLogin ? new Date(lastLogin.setHours(0, 0, 0, 0)) : null;

    // Award login points
    const { points: updatedPoints, level: updatedLevel } = await awardLoginPoints(user._id);

    res.json({
      _id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      points: updatedPoints,
      level: updatedLevel,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

//signup
const signupUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
  if (!email || !username || !password) {
    res.status(400);
    throw new Error("Please provide email, username and password");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const user = await User.create({
    email,
    username,
    passwordHash,
    role,
  });
  if (user) {
    res.status(201).json({
      _id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

module.exports = {
  fetchUsers,
  getCurrentUser,
  getUserById,
  loginUser,
  signupUser,
  awardLoginPoints,
};
