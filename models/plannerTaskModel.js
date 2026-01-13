const mongoose = require("mongoose");

const plannerTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
plannerTaskSchema.index({ userId: 1, dueDate: 1 });
plannerTaskSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model("PlannerTask", plannerTaskSchema);
