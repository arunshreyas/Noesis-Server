const express = require("express");
const router = express.Router();

const {
  submitOnboardingForm,
  fetchOnboardingForm,
} = require("../controllers/onBoardingController");

const { requireAuth } = require("../middleware/authMiddleware");

// Submit onboarding form
router.post("/onboarding", requireAuth, submitOnboardingForm);

// Fetch user's onboarding form
router.get("/onboarding", requireAuth, fetchOnboardingForm);

module.exports = router;
