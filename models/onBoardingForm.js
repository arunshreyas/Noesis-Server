const mongoose = require("mongoose");

const onBoardingFormSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    role: {
      type: String,
      enum: [
        "student",
        "college_student",
        "professional",
        "freelancer",
        "other",
      ],
      required: true,
    },

    wakeUpTime: {
      type: String, // "05:30"
    },

    sleepInconsistent: {
      type: Boolean,
      default: false,
    },

    currentHabits: {
      type: [String], // ["exercise", "reading"]
      default: [],
    },

    consistencyLevel: {
      type: String,
      enum: ["very_inconsistent", "somewhat_consistent", "mostly_consistent"],
    },

    dailyFreeTime: {
      type: String,
      enum: ["15-30", "30-60", "60-120", "120+"],
    },

    focusArea: {
      type: String,
      enum: [
        "productivity",
        "fitness",
        "sleep",
        "focus",
        "mental_health",
        "all_round",
      ],
      required: true,
    },

    blockers: {
      type: [String], // ["procrastination", "low_energy"]
      default: [],
    },

    extraInfo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OnboardingForm", onBoardingFormSchema);
