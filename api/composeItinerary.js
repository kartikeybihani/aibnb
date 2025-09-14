// api/composeItinerary.js
// Node 18 on Vercel (CommonJS)
// npm i @anthropic-ai/sdk zod

const Anthropic = require("@anthropic-ai/sdk");
const { z } = require("zod");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ======================= ZOD SCHEMAS =======================

const SwipeDataSchema = z.object({
  liked: z.array(z.string()), // array of item IDs that were liked
  disliked: z.array(z.string()), // array of item IDs that were disliked
  totalSwiped: z.number().int().min(0),
});

const ItineraryDaySchema = z.object({
  day: z.number().int().positive(),
  date: z.string().optional(), // ISO date string
  city: z.string(),
  activities: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      time: z.string(), // "09:00", "14:30", etc.
      duration: z.string(), // "2 hours", "30 min", etc.
      type: z.enum(["restaurant", "activity", "transport", "accommodation"]),
      location: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
});

const ItinerarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  totalDays: z.number().int().positive(),
  cities: z.array(z.string()),
  days: z.array(ItineraryDaySchema),
  estimatedCost: z.object({
    total: z.number(),
    perPerson: z.number(),
    currency: z.string().default("USD"),
  }),
  recommendations: z.array(z.string()).optional(),
});

// ======================= HTTP HANDLER =======================

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST only" });

  try {
    const { intake, options, swipes } = req.body || {};

    if (!intake || !options || !swipes) {
      return res.status(400).json({
        error: "intake, options, and swipes are required",
      });
    }

    // Validate swipes data
    const validatedSwipes = SwipeDataSchema.parse(swipes);

    console.log("🎯 ComposeItinerary Request:", {
      intake: {
        destinations: intake.destinations?.map((d) => d.city),
        tripLength: intake.trip_length_days,
        party: intake.party,
        budget: intake.budget,
        vibe: intake.vibe,
      },
      options: {
        restaurants: options.restaurants?.length || 0,
        activities: options.activities?.length || 0,
        categories: options.categories?.length || 0,
      },
      swipes: {
        liked: validatedSwipes.liked.length,
        disliked: validatedSwipes.disliked.length,
        totalSwiped: validatedSwipes.totalSwiped,
      },
    });

    // Build prompt and call Anthropic
    const system = systemPrompt();
    const user = userPrompt(intake, options, validatedSwipes);

    const msg = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
    });

    const rawText = msg?.content?.[0]?.text || "{}";
    const json = tryParseJson(rawText);

    // Validate the response
    const itinerary = ItinerarySchema.parse(json);

    res.status(200).json({
      status: "ok",
      itinerary,
      meta: {
        model: "claude-3-5-haiku-20241022",
        swipesUsed: validatedSwipes.totalSwiped,
        likedItems: validatedSwipes.liked.length,
        dislikedItems: validatedSwipes.disliked.length,
      },
    });
  } catch (err) {
    console.error("composeItinerary error:", err);
    const fallback = buildFallbackItinerary();
    res.status(200).json({
      status: "ok",
      itinerary: fallback,
      meta: { fallback: true, error: err.message },
    });
  }
};

// ======================= PROMPTS =======================

function systemPrompt() {
  return `
You are an expert travel itinerary composer for a Tinder-style swipe app.

Goal
- Create a detailed day-by-day itinerary based on user preferences from swipes
- Use ONLY the items the user liked (swiped right on)
- Avoid items the user disliked (swiped left on)
- Create a realistic, enjoyable travel experience
- Include practical details like timing, locations, and transitions
- Respect the user's budget, vibe, and travel constraints

Rules
- Return ONLY valid JSON matching the ItinerarySchema exactly. Do not include any other text.
- Use liked items as the foundation for the itinerary
- If you need additional items not in the liked list, you can suggest them but mark them as "suggested" in notes
- Balance activities with meals and rest time
- Consider travel time between locations
- Include practical information like opening hours, reservations needed, etc.
- Make the itinerary feel personal and tailored to their preferences
`.trim();
}

function userPrompt(intake, options, swipes) {
  const likedItems = getLikedItems(options, swipes.liked);
  const dislikedItems = getDislikedItems(options, swipes.disliked);

  return `
Travel Intake:
${JSON.stringify(intake, null, 2)}

Available Options:
Restaurants: ${options.restaurants?.length || 0} items
Activities: ${options.activities?.length || 0} items
Categories: ${options.categories?.length || 0} categories

User Swipe Preferences:
- Liked items (${swipes.liked.length}): ${swipes.liked.join(", ")}
- Disliked items (${swipes.disliked.length}): ${swipes.disliked.join(", ")}
- Total swiped: ${swipes.totalSwiped}

Liked Items Details:
${JSON.stringify(likedItems, null, 2)}

Disliked Items Details:
${JSON.stringify(dislikedItems, null, 2)}

Create a detailed itinerary using the liked items as your foundation. Include:
1. A compelling title and summary
2. Day-by-day breakdown with specific times
3. Mix of restaurants and activities from the liked items
4. Practical details like travel time, reservations, etc.
5. Cost estimates based on the budget
6. Additional recommendations if needed

IMPORTANT: Return ONLY the JSON object matching this schema. Do not include any explanatory text, markdown formatting, or other content.
{
  "title": "string",
  "summary": "string", 
  "totalDays": number,
  "cities": ["string"],
  "days": [
    {
      "day": number,
      "date": "string (optional)",
      "city": "string",
      "activities": [
        {
          "id": "string",
          "title": "string",
          "time": "string",
          "duration": "string", 
          "type": "restaurant|activity|transport|accommodation",
          "location": "string (optional)",
          "notes": "string (optional)"
        }
      ]
    }
  ],
  "estimatedCost": {
    "total": number,
    "perPerson": number,
    "currency": "USD"
  },
  "recommendations": ["string (optional)"]
}
`.trim();
}

// ======================= HELPERS =======================

function getLikedItems(options, likedIds) {
  const items = [];

  // Add liked restaurants
  if (options.restaurants) {
    items.push(...options.restaurants.filter((r) => likedIds.includes(r.id)));
  }

  // Add liked activities
  if (options.activities) {
    items.push(...options.activities.filter((a) => likedIds.includes(a.id)));
  }

  // Add liked items from categories
  if (options.categories) {
    options.categories.forEach((category) => {
      if (category.examples) {
        items.push(...category.examples.filter((e) => likedIds.includes(e.id)));
      }
    });
  }

  return items;
}

function getDislikedItems(options, dislikedIds) {
  const items = [];

  // Add disliked restaurants
  if (options.restaurants) {
    items.push(
      ...options.restaurants.filter((r) => dislikedIds.includes(r.id))
    );
  }

  // Add disliked activities
  if (options.activities) {
    items.push(...options.activities.filter((a) => dislikedIds.includes(a.id)));
  }

  // Add disliked items from categories
  if (options.categories) {
    options.categories.forEach((category) => {
      if (category.examples) {
        items.push(
          ...category.examples.filter((e) => dislikedIds.includes(e.id))
        );
      }
    });
  }

  return items;
}

function tryParseJson(txt) {
  try {
    return JSON.parse(txt);
  } catch (error) {
    console.log("JSON parse error:", error.message);
    console.log("Attempting to fix malformed JSON...");

    // Try to find the main JSON object
    const match = txt.match(/\{[\s\S]*$/);
    if (!match) {
      console.log("No JSON object found in response");
      return {};
    }

    let jsonStr = match[0];

    // Multiple repair strategies
    const repairStrategies = [
      // Strategy 1: Simple cleanup
      (str) => {
        let fixed = str;
        // Remove trailing incomplete strings
        fixed = fixed.replace(/"[^"]*$/, '""');
        // Remove trailing commas
        fixed = fixed.replace(/,(\s*[}\]])/, "$1");
        // Remove incomplete property names
        fixed = fixed.replace(/,\s*"[^"]*$/, "");
        return fixed;
      },

      // Strategy 2: Aggressive closing
      (str) => {
        let fixed = str;
        // Remove any trailing incomplete content
        fixed = fixed.replace(/,\s*$/, "");
        fixed = fixed.replace(/"[^"]*$/, '""');
        fixed = fixed.replace(/:\s*$/, ': ""');

        // Count and balance braces/brackets
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;

        // Add missing closing brackets first
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixed += "]";
        }

        // Add missing closing braces
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixed += "}";
        }

        return fixed;
      },
    ];

    // Try each repair strategy
    for (let i = 0; i < repairStrategies.length; i++) {
      try {
        const repaired = repairStrategies[i](jsonStr);
        console.log(`Trying repair strategy ${i + 1}...`);
        const result = JSON.parse(repaired);
        console.log(`Strategy ${i + 1} succeeded!`);
        return result;
      } catch (e) {
        console.log(`Strategy ${i + 1} failed:`, e.message);
        continue;
      }
    }

    console.log("All JSON repair attempts failed, returning empty object");
    return {};
  }
}

function buildFallbackItinerary() {
  return {
    title: "Your Amazing Trip",
    summary: "A carefully crafted itinerary based on your preferences",
    totalDays: 3,
    cities: ["Tokyo"],
    days: [
      {
        day: 1,
        city: "Tokyo",
        activities: [
          {
            id: "day1_morning",
            title: "Morning Exploration",
            time: "09:00",
            duration: "2 hours",
            type: "activity",
            notes: "Start your day with local exploration",
          },
          {
            id: "day1_lunch",
            title: "Local Lunch",
            time: "12:00",
            duration: "1 hour",
            type: "restaurant",
            notes: "Try local cuisine",
          },
          {
            id: "day1_afternoon",
            title: "Afternoon Activity",
            time: "14:00",
            duration: "3 hours",
            type: "activity",
            notes: "Cultural experience",
          },
        ],
      },
      {
        day: 2,
        city: "Tokyo",
        activities: [
          {
            id: "day2_breakfast",
            title: "Breakfast",
            time: "08:00",
            duration: "1 hour",
            type: "restaurant",
            notes: "Start with a good breakfast",
          },
          {
            id: "day2_morning",
            title: "Morning Activity",
            time: "10:00",
            duration: "2 hours",
            type: "activity",
            notes: "Explore more of the city",
          },
        ],
      },
      {
        day: 3,
        city: "Tokyo",
        activities: [
          {
            id: "day3_final",
            title: "Final Day",
            time: "10:00",
            duration: "4 hours",
            type: "activity",
            notes: "Make the most of your last day",
          },
        ],
      },
    ],
    estimatedCost: {
      total: 500,
      perPerson: 250,
      currency: "USD",
    },
    recommendations: [
      "Book restaurants in advance",
      "Check opening hours",
      "Bring comfortable walking shoes",
    ],
  };
}
