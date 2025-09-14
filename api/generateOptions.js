// api/generateOptions.js
// Node 18 on Vercel (CommonJS)
// npm i @anthropic-ai/sdk zod

const Anthropic = require("@anthropic-ai/sdk");
const { z } = require("zod");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ======================= ZOD SCHEMAS =======================

const ExampleBase = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string(),
  description: z.string().optional(),
  image_url: z.union([z.string(), z.null()]).optional(),
  metadata: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      location: z.string().optional(), // neighborhood
      price_range: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
      rating_hint: z.number().min(0).max(1).optional(),
      tags: z.array(z.string()).optional(),

      // dining extras
      cuisine: z.string().optional(),
      meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
      amenities: z.array(z.string()).optional(),

      // activity extras
      type: z
        .enum([
          "sightseeing",
          "adventure",
          "cultural",
          "relaxation",
          "class",
          "tour",
          "shopping",
          "nightlife",
        ])
        .optional(),
      duration: z.string().optional(),
      difficulty: z.enum(["easy", "moderate", "challenging"]).optional(),
      best_time: z
        .enum(["morning", "afternoon", "evening", "anytime"])
        .optional(),
      ticket_required: z.boolean().optional(),

      // coordinates if the model knows
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .default({}),
});

const CategorySchema = z.object({
  name: z.string(),
  type: z.string(), // accommodations, dining, activities, or optional category keys
  description: z.string().optional(),
  examples: z.array(ExampleBase).length(4),
});

const RestaurantNorm = z.object({
  id: z.string(),
  kind: z.literal("restaurant"),
  title: z.string(),
  city: z.string(),
  country: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cuisine: z.string(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  tags: z.array(z.string()).optional(),
  est_cost_per_person: z.number().optional(),
  est_duration_min: z.number().optional(),
  rating_hint: z.number().min(0).max(1).optional(),
  source: z.literal("ai").default("ai"),
});

const ActivityNorm = z.object({
  id: z.string(),
  kind: z.literal("activity"),
  title: z.string(),
  city: z.string(),
  country: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.enum([
    "outdoor",
    "museum",
    "tour",
    "shopping",
    "nightlife",
    "class",
  ]),
  tags: z.array(z.string()).optional(),
  est_cost_per_person: z.number().optional(),
  est_duration_min: z.number().optional(),
  rating_hint: z.number().min(0).max(1).optional(),
  ticket_required: z.boolean().optional(),
  time_windows: z
    .array(z.object({ start: z.string(), end: z.string() }))
    .optional(),
  source: z.literal("ai").default("ai"),
});

const PayloadSchema = z.object({
  categories: z.array(CategorySchema),
  restaurants: z.array(RestaurantNorm),
  activities: z.array(ActivityNorm),
  guardrails: z.object({
    dont_repeat_restaurants: z.boolean(),
    max_same_cuisine_per_trip: z.number(),
    max_commute_min_per_leg: z.number(),
  }),
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
    const { intake, counts } = req.body || {};
    if (
      !intake ||
      !Array.isArray(intake.destinations) ||
      !intake.destinations.length
    ) {
      return res
        .status(400)
        .json({ error: "intake with at least one destination is required" });
    }

    const cityFallback = intake.destinations[0]?.city || "City";
    const scaled = scaleCounts(intake, counts);

    // Build prompt and call Anthropic JSON mode
    const system = systemPrompt();
    const user = userPrompt(intake, scaled);

    const msg = await anthropic.messages.create({
      model: "claude-3.5-sonnet",
      max_tokens: 3000,
      system,
      messages: [{ role: "user", content: user }],
    });

    const rawText = msg?.content?.[0]?.text || "{}";
    const json = tryParseJson(rawText);

    // If the model only returned categories, flatten them to normalized arrays
    if (!json.restaurants || !json.activities) {
      const flat = flattenFromCategories(json, intake);
      json.restaurants = flat.restaurants;
      json.activities = flat.activities;
      json.guardrails ||= {
        dont_repeat_restaurants: true,
        max_same_cuisine_per_trip: 2,
        max_commute_min_per_leg: 30,
      };
    }

    // Post process
    let payload = PayloadSchema.parse(json);
    payload = polishPayload(payload, cityFallback, scaled);

    res.status(200).json({
      status: "ok",
      options: payload,
      meta: {
        model: "claude-3.5-sonnet",
        counts: scaled,
        destinations: intake.destinations.map((d) => d.city),
      },
    });
  } catch (err) {
    console.error("generateOptions error:", err);
    const fallback = buildFallback();
    res.status(200).json({
      status: "ok",
      options: fallback,
      meta: { fallback: true },
    });
  }
};

// ======================= PROMPTS =======================

function systemPrompt() {
  return `
You are a travel options generator for a Tinder style swipe app.

Goal
- Read the Intake and produce swipeable options for Dining and Activities, plus curated Category rows for UX variety.
- Make items realistic for the destination. Prefer notable places over chains.
- Distribute Dining by meal_type breakfast lunch dinner snack with no repeats.
- Spread across neighborhoods. Avoid clustering.
- Respect dietary and vibe. Bias to relaxed balanced adventurous as given.
- Use rating_hint 0..1 as your confidence hint. Do not invent star ratings.
- If you infer something, add an "assumed" tag.
- Return ONLY valid JSON that matches the Output schema exactly. Do not include any other text.

Typing rules
- String ids only. Use stable slugs or name based ids when possible.
- Put city on every item. For multi city Intake, include items for all cities.
`.trim();
}

function userPrompt(intake, scaled) {
  return `
Intake
${JSON.stringify(intake, null, 2)}

Output schema example
{
  "categories": [
    { "name": "Accommodations", "type": "accommodations", "description": "Places to stay", "examples": [ExampleItem x4] },
    { "name": "Dining", "type": "dining", "description": "Restaurant and food options", "examples": [ExampleItemDining x4] },
    { "name": "Activities", "type": "activities", "description": "Things to do and experiences", "examples": [ExampleItemActivity x4] },
    // Choose two to four more that fit the Intake best, each with exactly 4 examples.
    // Transportation, Neighborhoods, Nightlife, Shopping, Cultural Experiences, Outdoor Adventures,
    // Relaxation, Entertainment, Local Markets, Wellness, Photography Spots, Family Activities,
    // Budget Options, Luxury Experiences
    {OptionalCategory}...
  ],

  "restaurants": Restaurant[],   // total about ${
    scaled.restaurants
  } across all cities
  "activities": Activity[],      // total about ${
    scaled.activities
  } across all cities

  "guardrails": {
    "dont_repeat_restaurants": true,
    "max_same_cuisine_per_trip": 2,
    "max_commute_min_per_leg": 30
  }
}

Types
ExampleItem = {
  "id": "string",
  "name": "Specific name",
  "description": "One or two sentences",
  "image_url": null,
  "metadata": {
    "city": "City",
    "country": "Country",
    "location": "Neighborhood",
    "price_range": "$|$$|$$$|$$$$",
    "rating_hint": 0.0,
    "tags": ["strings"],
    "lat": 0, "lng": 0
  }
}
ExampleItemDining extends ExampleItem with {
  "metadata": { "cuisine": "Ramen", "meal_type": "breakfast|lunch|dinner|snack", "amenities": ["reservation recommended"] }
}
ExampleItemActivity extends ExampleItem with {
  "metadata": { "type": "sightseeing|adventure|cultural|relaxation|class|tour|shopping|nightlife", "duration": "2 hours|half day|120 min", "difficulty": "easy|moderate|challenging", "best_time": "morning|afternoon|evening|anytime", "ticket_required": true }
}
Restaurant = {
  "id": "string", "kind": "restaurant", "title": "name", "city": "City", "country": "Country",
  "lat": 0, "lng": 0, "cuisine": "string", "meal_type": "breakfast|lunch|dinner|snack",
  "tags": ["strings"], "est_cost_per_person": 0, "est_duration_min": 0, "rating_hint": 0.0, "source": "ai"
}
Activity = {
  "id": "string", "kind": "activity", "title": "name", "city": "City", "country": "Country",
  "lat": 0, "lng": 0, "category": "outdoor|museum|tour|shopping|nightlife|class",
  "tags": ["strings"], "est_cost_per_person": 0, "est_duration_min": 0, "rating_hint": 0.0,
  "ticket_required": false, "time_windows": [{ "start": "09:00", "end": "12:00" }], "source": "ai"
}

Constraints
- Produce roughly ${scaled.restaurants} restaurants and ${
    scaled.activities
  } activities total across all cities.
- Always include the three required categories. Each category must have exactly 4 examples.
- No duplicate names within 200 meters. Vary cuisines and categories. Respect dietary.
- If you are unsure about coords, omit them.

IMPORTANT: Return ONLY the JSON object. Do not include any explanatory text, markdown formatting, or other content.
`.trim();
}

// ======================= HELPERS =======================

function scaleCounts(intake, counts) {
  const days =
    intake.trip_length_days ||
    diffDays(intake?.dates?.start, intake?.dates?.end) ||
    5;
  const restaurants = clamp(
    counts?.restaurants ?? Math.round(days * 2.4),
    8,
    24
  );
  const activities = clamp(
    counts?.activities ?? Math.round(days * 3.6),
    12,
    36
  );
  return { days, restaurants, activities };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function diffDays(a, b) {
  if (!a || !b) return 0;
  const d1 = new Date(a + "T00:00:00Z");
  const d2 = new Date(b + "T00:00:00Z");
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

function tryParseJson(txt) {
  try {
    return JSON.parse(txt);
  } catch {
    const m = txt.match(/\{[\s\S]*\}$/);
    return m ? JSON.parse(m[0]) : {};
  }
}

function slugId(str) {
  return (
    String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

function priceToNumber(p) {
  if (p === "$") return 15;
  if (p === "$$") return 35;
  if (p === "$$$") return 65;
  if (p === "$$$$") return 120;
  return undefined;
}

function parseDuration(s) {
  if (!s) return undefined;
  const m = /(\d+)\s*(min|mins|minutes)/i.exec(s);
  if (m) return parseInt(m[1], 10);
  const h = /(\d+)\s*(h|hr|hrs|hour|hours)/i.exec(s);
  if (h) return parseInt(h[1], 10) * 60;
  if (/half\s*day/i.test(s)) return 180;
  if (/full\s*day/i.test(s)) return 420;
  return undefined;
}

function mapActivityType(t) {
  const s = String(t || "").toLowerCase();
  if (["museum", "gallery"].some((k) => s.includes(k))) return "museum";
  if (["shop", "shopping", "market"].some((k) => s.includes(k)))
    return "shopping";
  if (["night", "bar", "club"].some((k) => s.includes(k))) return "nightlife";
  if (["class", "workshop", "cook"].some((k) => s.includes(k))) return "class";
  if (["tour", "walk", "guided"].some((k) => s.includes(k))) return "tour";
  return "outdoor";
}

function distributeMeals(list) {
  // ensure meal_type balance when missing
  if (!list.length) return list;
  const order = ["breakfast", "lunch", "dinner", "snack"];
  let i = 0;
  return list.map((r) => {
    if (!r.meal_type) r.meal_type = order[i % order.length];
    i++;
    return r;
  });
}

function dedupeByNameCity(items) {
  const seen = new Set();
  return items.filter((x) => {
    const key = `${x.title?.toLowerCase().trim()}__${x.city
      ?.toLowerCase()
      .trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// If the model only returns categories, convert dining and activities examples into normalized arrays
function flattenFromCategories(payload, intake) {
  const restaurants = [];
  const activities = [];
  const fallbackCity = intake.destinations?.[0]?.city || "City";
  const fallbackCountry = intake.destinations?.[0]?.country;

  for (const cat of payload?.categories || []) {
    if (!cat?.examples) continue;

    if (String(cat.type).toLowerCase() === "dining") {
      for (const e of cat.examples) {
        const id = String(e.id ?? slugId(e.name));
        const city = e.metadata?.city || fallbackCity;
        restaurants.push({
          id,
          kind: "restaurant",
          title: e.name,
          city,
          country: e.metadata?.country || fallbackCountry,
          lat: e.metadata?.lat,
          lng: e.metadata?.lng,
          cuisine: e.metadata?.cuisine || "mixed",
          meal_type: e.metadata?.meal_type || "dinner",
          tags: e.metadata?.tags || [],
          est_cost_per_person: priceToNumber(e.metadata?.price_range),
          est_duration_min: undefined,
          rating_hint:
            typeof e.metadata?.rating_hint === "number"
              ? e.metadata.rating_hint
              : 0.5,
          source: "ai",
        });
      }
    }

    if (String(cat.type).toLowerCase() === "activities") {
      for (const e of cat.examples) {
        const id = String(e.id ?? slugId(e.name));
        const city = e.metadata?.city || fallbackCity;
        activities.push({
          id,
          kind: "activity",
          title: e.name,
          city,
          country: e.metadata?.country || fallbackCountry,
          lat: e.metadata?.lat,
          lng: e.metadata?.lng,
          category: mapActivityType(e.metadata?.type),
          tags: e.metadata?.tags || [],
          est_cost_per_person: priceToNumber(e.metadata?.price_range),
          est_duration_min: parseDuration(e.metadata?.duration),
          rating_hint:
            typeof e.metadata?.rating_hint === "number"
              ? e.metadata.rating_hint
              : 0.5,
          ticket_required: !!e.metadata?.ticket_required,
          time_windows: [],
          source: "ai",
        });
      }
    }
  }

  return {
    restaurants: RestaurantNorm.array().parse(
      distributeMeals(dedupeByNameCity(restaurants))
    ),
    activities: ActivityNorm.array().parse(dedupeByNameCity(activities)),
  };
}

function polishPayload(payload, cityFallback, scaled) {
  // Fill missing city fields and ids, dedupe, balance meals, clamp sizes
  let restaurants = payload.restaurants.map((r) => ({
    ...r,
    id: r.id || slugId(r.title),
    city: r.city || cityFallback,
    rating_hint: typeof r.rating_hint === "number" ? r.rating_hint : 0.5,
    source: "ai",
  }));
  restaurants = distributeMeals(restaurants);
  restaurants = dedupeByNameCity(restaurants).slice(0, scaled.restaurants);

  let activities = payload.activities.map((a) => ({
    ...a,
    id: a.id || slugId(a.title),
    city: a.city || cityFallback,
    rating_hint: typeof a.rating_hint === "number" ? a.rating_hint : 0.5,
    category: a.category || "tour",
    source: "ai",
  }));
  activities = dedupeByNameCity(activities).slice(0, scaled.activities);

  const guardrails = payload.guardrails || {
    dont_repeat_restaurants: true,
    max_same_cuisine_per_trip: 2,
    max_commute_min_per_leg: 30,
  };

  const categories = (payload.categories || []).slice(0, 7); // keep it tidy

  return {
    categories,
    restaurants: RestaurantNorm.array().parse(restaurants),
    activities: ActivityNorm.array().parse(activities),
    guardrails,
  };
}

function buildFallback() {
  const options = {
    categories: [
      {
        name: "Dining",
        type: "dining",
        description: "Restaurant and food options",
        examples: [
          {
            name: "Sample Ramen Bar",
            metadata: {
              city: "Tokyo",
              cuisine: "Ramen",
              meal_type: "dinner",
              price_range: "$$",
              rating_hint: 0.5,
            },
          },
          {
            name: "Morning Kissaten",
            metadata: {
              city: "Tokyo",
              cuisine: "Cafe",
              meal_type: "breakfast",
              price_range: "$",
              rating_hint: 0.5,
            },
          },
          {
            name: "Sushi Alley",
            metadata: {
              city: "Tokyo",
              cuisine: "Sushi",
              meal_type: "lunch",
              price_range: "$$$",
              rating_hint: 0.5,
            },
          },
          {
            name: "Izakaya Street",
            metadata: {
              city: "Tokyo",
              cuisine: "Izakaya",
              meal_type: "dinner",
              price_range: "$$",
              rating_hint: 0.5,
            },
          },
        ],
      },
      {
        name: "Activities",
        type: "activities",
        description: "Things to do",
        examples: [
          {
            name: "Neighborhood Walk",
            metadata: {
              city: "Tokyo",
              type: "tour",
              duration: "90 min",
              rating_hint: 0.5,
            },
          },
          {
            name: "Modern Art Stop",
            metadata: {
              city: "Tokyo",
              type: "cultural",
              duration: "2 hours",
              rating_hint: 0.5,
            },
          },
          {
            name: "Ueno Park Stroll",
            metadata: {
              city: "Tokyo",
              type: "sightseeing",
              duration: "2 hours",
              rating_hint: 0.5,
            },
          },
          {
            name: "Asakusa Photo Hour",
            metadata: {
              city: "Tokyo",
              type: "class",
              duration: "60 min",
              rating_hint: 0.5,
            },
          },
        ],
      },
      {
        name: "Accommodations",
        type: "accommodations",
        description: "Places to stay",
        examples: [
          {
            name: "Shinjuku Business Hotel",
            metadata: { city: "Tokyo", price_range: "$$", rating_hint: 0.5 },
          },
          {
            name: "Asakusa Hostel",
            metadata: { city: "Tokyo", price_range: "$", rating_hint: 0.5 },
          },
          {
            name: "Ginza Boutique Stay",
            metadata: { city: "Tokyo", price_range: "$$$", rating_hint: 0.5 },
          },
          {
            name: "Shibuya Capsule Pods",
            metadata: { city: "Tokyo", price_range: "$", rating_hint: 0.5 },
          },
        ],
      },
    ],
    restaurants: [
      {
        id: "r1",
        kind: "restaurant",
        title: "Sample Ramen Bar",
        city: "Tokyo",
        cuisine: "Ramen",
        meal_type: "dinner",
        rating_hint: 0.5,
        source: "ai",
      },
      {
        id: "r2",
        kind: "restaurant",
        title: "Morning Kissaten",
        city: "Tokyo",
        cuisine: "Cafe",
        meal_type: "breakfast",
        rating_hint: 0.5,
        source: "ai",
      },
      {
        id: "r3",
        kind: "restaurant",
        title: "Sushi Alley",
        city: "Tokyo",
        cuisine: "Sushi",
        meal_type: "lunch",
        rating_hint: 0.5,
        source: "ai",
      },
      {
        id: "r4",
        kind: "restaurant",
        title: "Izakaya Street",
        city: "Tokyo",
        cuisine: "Izakaya",
        meal_type: "dinner",
        rating_hint: 0.5,
        source: "ai",
      },
    ],
    activities: [
      {
        id: "a1",
        kind: "activity",
        title: "Neighborhood Walk",
        city: "Tokyo",
        category: "tour",
        est_duration_min: 90,
        rating_hint: 0.5,
        source: "ai",
      },
      {
        id: "a2",
        kind: "activity",
        title: "Modern Art Stop",
        city: "Tokyo",
        category: "museum",
        est_duration_min: 120,
        rating_hint: 0.5,
        source: "ai",
      },
      {
        id: "a3",
        kind: "activity",
        title: "Ueno Park Stroll",
        city: "Tokyo",
        category: "outdoor",
        est_duration_min: 120,
        rating_hint: 0.5,
        source: "ai",
      },
      {
        id: "a4",
        kind: "activity",
        title: "Asakusa Photo Hour",
        city: "Tokyo",
        category: "class",
        est_duration_min: 60,
        rating_hint: 0.5,
        source: "ai",
      },
    ],
    guardrails: {
      dont_repeat_restaurants: true,
      max_same_cuisine_per_trip: 2,
      max_commute_min_per_leg: 30,
    },
  };
  return PayloadSchema.parse(options);
}
