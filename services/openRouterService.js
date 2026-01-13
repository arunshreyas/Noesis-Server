const axios = require("axios");
require("dotenv").config();

/**
 * Generate personalized habits using OpenRouter API
 * @param {Object} onboardingData - User's onboarding form data
 * @returns {Array} Array of generated habit objects
 */
const generateHabits = async (onboardingData) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  // Use a free/cheap model - meta-llama/llama-3.2-3b-instruct:free is a good option
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free";

  // Build prompt based on onboarding data
  const role = onboardingData.role || "student";
  const dailyFreeTime = onboardingData.dailyFreeTime || "30-60";
  const currentHabits = onboardingData.currentHabits || [];
  const focusArea = onboardingData.focusArea || "all_round";
  const consistencyLevel = onboardingData.consistencyLevel || "somewhat_consistent";

  const prompt = `You are a habit coach. Generate 5-7 personalized, simple, and realistic habits for a ${role}.

User context:
- Role: ${role}
- Daily free time: ${dailyFreeTime} minutes
- Current habits: ${currentHabits.length > 0 ? currentHabits.join(", ") : "none"}
- Focus area: ${focusArea}
- Consistency level: ${consistencyLevel}

Requirements:
1. Generate exactly 5-7 habits
2. Habits must be simple and realistic for a ${role}
3. Respect the daily free time of ${dailyFreeTime} minutes
4. Do NOT include any habits from: ${currentHabits.join(", ") || "none"}
5. Each habit should be achievable and specific

Return ONLY a valid JSON array of habit objects with this exact structure:
[
  {
    "title": "Habit name (short, 2-4 words)",
    "description": "Brief description (1 sentence)",
    "schedule": "daily"
  },
  ...
]

Do not include any text before or after the JSON array.`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
          "X-Title": "Noesis Habit Tracker",
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Extract JSON from response (handle cases where model adds extra text)
    let jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Try to parse the entire content
      jsonMatch = [content];
    }

    const habits = JSON.parse(jsonMatch[0]);

    // Validate and format habits
    if (!Array.isArray(habits) || habits.length === 0) {
      throw new Error("Invalid habits format from AI");
    }

    // Ensure we have 5-7 habits, pad with defaults if needed
    const formattedHabits = habits.slice(0, 7).map((habit) => ({
      title: habit.title || "New Habit",
      description: habit.description || "A habit to improve your daily routine",
      schedule: habit.schedule || "daily",
    }));

    // If we got fewer than 5, add some generic ones
    while (formattedHabits.length < 5) {
      formattedHabits.push({
        title: `Focus on ${focusArea}`,
        description: `A simple daily practice to improve your ${focusArea}`,
        schedule: "daily",
      });
    }

    return formattedHabits.slice(0, 7);
  } catch (error) {
    console.error("OpenRouter API error:", error.response?.data || error.message);
    
    // Fallback: return default habits if API fails
    return generateFallbackHabits(onboardingData);
  }
};

/**
 * Generate fallback habits if OpenRouter API fails
 */
const generateFallbackHabits = (onboardingData) => {
  const role = onboardingData.role || "student";
  const focusArea = onboardingData.focusArea || "all_round";
  
  const roleBasedHabits = {
    student: [
      { title: "Review Today's Notes", description: "Spend 10 minutes reviewing what you learned today", schedule: "daily" },
      { title: "Morning Planning", description: "Plan your day in the morning", schedule: "daily" },
      { title: "Evening Reflection", description: "Reflect on your day before bed", schedule: "daily" },
    ],
    professional: [
      { title: "Morning Routine", description: "Start your day with a consistent morning routine", schedule: "daily" },
      { title: "Task Prioritization", description: "Prioritize your top 3 tasks each morning", schedule: "daily" },
      { title: "Evening Wind Down", description: "Take time to unwind after work", schedule: "daily" },
    ],
  };

  const focusAreaHabits = {
    productivity: [
      { title: "Time Blocking", description: "Block time for important tasks", schedule: "daily" },
      { title: "Digital Detox", description: "Take breaks from screens", schedule: "daily" },
    ],
    fitness: [
      { title: "Daily Movement", description: "Get at least 15 minutes of movement", schedule: "daily" },
      { title: "Stretch Break", description: "Take stretching breaks throughout the day", schedule: "daily" },
    ],
    sleep: [
      { title: "Consistent Bedtime", description: "Go to bed at the same time each night", schedule: "daily" },
      { title: "No Screens Before Bed", description: "Avoid screens 30 minutes before sleep", schedule: "daily" },
    ],
    focus: [
      { title: "Deep Work Session", description: "Dedicate time for focused work", schedule: "daily" },
      { title: "Mindfulness Practice", description: "Practice 5 minutes of mindfulness", schedule: "daily" },
    ],
    mental_health: [
      { title: "Gratitude Journal", description: "Write down 3 things you're grateful for", schedule: "daily" },
      { title: "Breathing Exercise", description: "Practice deep breathing exercises", schedule: "daily" },
    ],
    all_round: [
      { title: "Daily Reflection", description: "Reflect on your day", schedule: "daily" },
      { title: "Small Win Celebration", description: "Celebrate one small win each day", schedule: "daily" },
    ],
  };

  const habits = [
    ...(roleBasedHabits[role] || roleBasedHabits.student),
    ...(focusAreaHabits[focusArea] || focusAreaHabits.all_round),
  ];

  // Remove duplicates and limit to 7
  const uniqueHabits = habits.filter((habit, index, self) =>
    index === self.findIndex((h) => h.title === habit.title)
  );

  return uniqueHabits.slice(0, 7);
};

module.exports = { generateHabits };
