// api/userQuery.js
// Node.js runtime on Vercel (CommonJS)

const Anthropic = require("@anthropic-ai/sdk");
const { z } = require("zod");

// Check if API key is available
console.log("ANTHROPIC_API_KEY available:", !!process.env.ANTHROPIC_API_KEY);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ----- Types with Zod to validate intake coming from the model -----
const IntakeSchema = z.object({
  destinations: z
    .array(
      z.object({
        city: z.string().min(1).optional(),
        region: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .optional(),
  dates: z.any().optional(),
  trip_length_days: z.number().int().positive().optional(),
  party: z.any().optional(),
  budget: z.any().optional(),
  vibe: z.any().optional(),
  travel_dates_for_seasonality: z.boolean().optional(),
  dietary: z.array(z.string()).optional(),
  extras: z.any().optional(),
});

const REQUIRED_KEYS = [
  "destinations",
  "trip_length_or_dates",
  "party_size",
  "budget",
  "vibe",
]; // not used, OK to remove

module.exports = async function handler(req, res) {
  const requestId = Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();

  console.log(`🚀 [${requestId}] Handler called:`, {
    method: req.method,
    url: req.url,
    headers: {
      "user-agent": req.headers["user-agent"],
      origin: req.headers.origin,
      "content-type": req.headers["content-type"],
    },
    timestamp,
  });

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    console.log(`✅ [${requestId}] CORS preflight request handled`);
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    console.log(`❌ [${requestId}] Invalid method: ${req.method}`);
    res.status(405).json({ error: "POST only" });
    return;
  }

  const body = req.body || {};
  const userText = body.userText;
  const partialIntake = body.partialIntake;
  const sessionId = body.sessionId;

  console.log(`📥 [${requestId}] Request body:`, {
    hasUserText: !!userText,
    userTextLength: userText?.length || 0,
    hasPartialIntake: !!partialIntake,
    sessionId,
    bodyKeys: Object.keys(body),
  });

  if (!userText && !partialIntake) {
    console.log(`❌ [${requestId}] Missing required fields`);
    res.status(400).json({ error: "Provide userText or partialIntake" });
    return;
  }

  try {
    console.log(`🔄 [${requestId}] Processing request:`, {
      userText:
        userText?.substring(0, 100) + (userText?.length > 100 ? "..." : ""),
      partialIntake: JSON.stringify(partialIntake, null, 2),
      sessionId,
    });

    let extracted = {};
    if (userText) {
      console.log(`🤖 [${requestId}] Extracting intake from text...`);
      extracted = await extractIntakeFromText(userText);
      console.log(`✅ [${requestId}] Extracted intake:`, extracted);
    }

    console.log(`⚙️ [${requestId}] Processing intake...`);
    processIntake(
      partialIntake || {},
      extracted || {},
      sessionId,
      res,
      requestId
    );
  } catch (err) {
    console.error(`💥 [${requestId}] API Error:`, {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
      timestamp,
    });

    res.status(500).json({
      error: String(err?.message || err),
      type: err?.name || "UnknownError",
      requestId,
    });
  }
};

async function extractIntakeFromText(userText) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log(`🤖 [${requestId}] Starting Anthropic API call...`, {
      userTextLength: userText?.length,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString(),
    });

    const system =
      "You are a travel intake parser.\n" +
      "You MUST return ONLY valid JSON that matches this exact structure:\n\n" +
      "{\n" +
      '  "destinations": [{"city": "string", "region": "string", "country": "string"}],\n' +
      '  "dates": {"start": "yyyy-mm-dd", "end": "yyyy-mm-dd"},\n' +
      '  "trip_length_days": number,\n' +
      '  "party": {"adults": number, "kids": number},\n' +
      '  "budget": {"level": "low|medium|high", "per_person_daily_usd": number},\n' +
      '  "vibe": {"pace": "relaxed|balanced|adventurous", "themes": ["string"]},\n' +
      '  "travel_dates_for_seasonality": boolean,\n' +
      '  "dietary": ["string"],\n' +
      '  "extras": {"key": "value"}\n' +
      "}\n\n" +
      "Rules:\n" +
      "- Return ONLY the JSON object, no other text\n" +
      "- Never invent facts\n" +
      "- If a detail is not explicit but strongly implied, include it and add an extras.assumptions array explaining the inference\n" +
      "- If the user gives nights convert to days (nights plus one)\n" +
      "- If the user gives total budget divide into per person per day and record the math in extras.assumptions\n" +
      "- Normalize synonyms:\n" +
      "  - cheap/student budget -> level: low\n" +
      "  - upscale/fine dining -> level: high\n" +
      "  - chill/easy/slow -> pace: relaxed\n" +
      "  - thrill/hike/intense -> pace: adventurous\n" +
      "- Dates must be ISO yyyy-mm-dd when present\n" +
      "- Put anything that does not fit a known field into extras\n" +
      "- Only include fields that have values, omit empty/undefined fields";

    console.log(`📤 [${requestId}] Sending request to Anthropic...`, {
      model: "claude-3-5-haiku-20241022",
      maxTokens: 1200,
      userTextPreview:
        userText?.substring(0, 200) + (userText?.length > 200 ? "..." : ""),
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1200,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Extract an Intake from this message. Return only the JSON object.\n\n" +
                userText,
            },
          ],
        },
      ],
    });

    console.log(`📥 [${requestId}] Anthropic API response received:`, {
      id: msg.id,
      type: msg.type,
      role: msg.role,
      contentLength: msg.content?.[0]?.text?.length || 0,
      usage: msg.usage,
    });

    const txt = msg?.content?.[0]?.text || "{}";
    console.log(`🔍 [${requestId}] Raw response text:`, txt);

    // Extract JSON from the response text (in case there's extra text)
    let jsonText = txt.trim();

    // Try to find JSON object in the text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    console.log(`🔍 [${requestId}] Extracted JSON text:`, jsonText);

    const parsed = JSON.parse(jsonText);
    const validated = safeParse(IntakeSchema, parsed);

    console.log(
      `✅ [${requestId}] Successfully extracted and validated intake:`,
      validated
    );
    return validated;
  } catch (error) {
    console.error(`💥 [${requestId}] Anthropic API error:`, {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      code: error?.code,
      status: error?.status,
      timestamp: new Date().toISOString(),
    });

    // Return empty object if API fails
    return {};
  }
}

// ----- Utility: schema for Anthropic JSON mode -----
function IntakeJsonSchemaProps() {
  return {
    destinations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          city: { type: "string" },
          region: { type: "string" },
          country: { type: "string" },
        },
        required: ["city"],
      },
    },
    dates: {
      type: "object",
      additionalProperties: false,
      properties: { start: { type: "string" }, end: { type: "string" } },
    },
    trip_length_days: { type: "number" },
    party: {
      type: "object",
      additionalProperties: false,
      properties: { adults: { type: "number" }, kids: { type: "number" } },
    },
    budget: {
      type: "object",
      additionalProperties: false,
      properties: {
        level: { type: "string", enum: ["low", "medium", "high"] },
        per_person_daily_usd: { type: "number" },
      },
    },
    vibe: {
      type: "object",
      additionalProperties: false,
      properties: {
        pace: { type: "string", enum: ["relaxed", "balanced", "adventurous"] },
        themes: { type: "array", items: { type: "string" } },
      },
    },
    travel_dates_for_seasonality: { type: "boolean" },
    dietary: { type: "array", items: { type: "string" } },
    extras: { type: "object", additionalProperties: true },
  };
}

// ----- Merge and normalize -----
function deepMergeIntake(base, add) {
  base = base || {};
  add = add || {};
  const out = JSON.parse(JSON.stringify(base));
  const put = (k, v) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      out[k] = v.length ? v : out[k];
    } else if (typeof v === "object") {
      out[k] = Object.assign({}, out[k] || {}, v);
    } else {
      out[k] = v;
    }
  };
  for (const k of Object.keys(add)) put(k, add[k]);
  if (out.destinations && !Array.isArray(out.destinations))
    out.destinations = [out.destinations];
  if (!out.extras) out.extras = {};
  return out;
}

function normalizeIntake(intake) {
  const x = JSON.parse(JSON.stringify(intake || {}));
  if (
    (!x.trip_length_days || x.trip_length_days <= 0) &&
    x.dates?.start &&
    x.dates?.end
  ) {
    const days = diffDaysISO(x.dates.start, x.dates.end);
    if (days > 0) {
      x.trip_length_days = days;
      x.travel_dates_for_seasonality = true;
    }
  }
  if (x.budget?.level) {
    const map = {
      cheap: "low",
      student: "low",
      affordable: "low",
      upscale: "high",
      luxury: "high",
    };
    const lv = x.budget.level.toLowerCase();
    if (map[lv]) x.budget.level = map[lv];
  }
  if (x.vibe?.themes) {
    const themes = x.vibe.themes
      .map((t) => String(t).toLowerCase().trim())
      .filter(Boolean);
    x.vibe.themes = Array.from(new Set(themes));
  }
  return safeParse(IntakeSchema, x);
}

function diffDaysISO(a, b) {
  try {
    const d1 = new Date(a + "T00:00:00Z");
    const d2 = new Date(b + "T00:00:00Z");
    return Math.round((d2 - d1) / 86400000);
  } catch {
    return 0;
  }
}

function findMissing(x) {
  const misses = [];
  if (!x.destinations?.length) misses.push("destinations");
  const hasDates = !!(x.dates?.start && x.dates?.end);
  if (!hasDates) misses.push("dates");
  const adults = x.party?.adults;
  if (!(Number.isFinite(adults) && adults > 0)) misses.push("party_size");
  const hasBudget =
    (x.budget && x.budget.level) ||
    (x.budget && Number.isFinite(x.budget.per_person_daily_usd));
  if (!hasBudget) misses.push("budget");
  if (!x.vibe?.pace) misses.push("vibe");
  return misses;
}

function buildFollowUp(kind, x) {
  if (kind === "destinations")
    return {
      question: "Where are you going",
      chips: ["Tokyo", "Kyoto", "Osaka", "Rome", "Florence", "Venice"],
    };
  if (kind === "dates")
    return {
      question: "What are your exact travel dates (start and end)",
      chips: ["Enter dates", "This week", "Next month", "Summer 2024"],
    };
  if (kind === "party_size")
    return {
      question: "How many people are going adults and kids",
      chips: ["Solo", "Two adults", "Two adults one kid", "Four adults"],
    };
  if (kind === "budget")
    return {
      question: "What budget level should I plan for or daily spend per person",
      chips: ["Low", "Medium", "High"],
    };
  if (kind === "vibe")
    return {
      question: "What vibe fits best",
      chips: ["Relaxed", "Balanced", "Adventurous"],
    };
  return { question: "Any other key detail", chips: [] };
}

function safeParse(schema, value) {
  try {
    const r = schema.safeParse(value || {});
    if (r.success) return r.data;

    // If safeParse fails, try to clean the data and parse again
    const cleanedValue = JSON.parse(JSON.stringify(value || {}));
    const r2 = schema.safeParse(cleanedValue);
    if (r2.success) return r2.data;

    // If still failing, return the cleaned value without validation
    console.log("Zod validation failed, returning unvalidated data:", r.error);
    return cleanedValue;
  } catch (error) {
    console.error("Error in safeParse:", error);
    return value || {};
  }
}

function processIntake(partialIntake, extracted, sessionId, res, requestId) {
  console.log(`🔄 [${requestId}] Processing intake:`, {
    partialIntake: JSON.stringify(partialIntake, null, 2),
    extracted: JSON.stringify(extracted, null, 2),
    sessionId,
  });

  const merged = normalizeIntake(deepMergeIntake(partialIntake, extracted));
  const missing = findMissing(merged);

  console.log(`📊 [${requestId}] Intake analysis:`, {
    merged: JSON.stringify(merged, null, 2),
    missing,
    hasDestinations: !!merged.destinations?.length,
    hasDates: !!(merged.dates?.start && merged.dates?.end),
    hasParty: !!merged.party?.adults,
    hasBudget: !!(merged.budget?.level || merged.budget?.per_person_daily_usd),
    hasVibe: !!merged.vibe?.pace,
  });

  let extraFollowUp = null;
  if (
    !missing.length &&
    Array.isArray(merged.destinations) &&
    merged.destinations.length > 1 &&
    !(merged.extras && merged.extras.day_split)
  ) {
    extraFollowUp = {
      question:
        "Do you want to split days across cities or should I spread them evenly",
      chips: ["Even split", "Rome 3 Florence 2 Venice 3", "I will specify"],
    };
    console.log(`📍 [${requestId}] Extra follow-up needed for day splitting`);
  }

  if (!missing.length && !extraFollowUp) {
    console.log(`✅ [${requestId}] Intake complete, ready for trip generation`);
    res.status(200).json({ status: "ready", sessionId, intake: merged });
    return;
  }

  const followUp = extraFollowUp || buildFollowUp(missing[0], merged);
  console.log(`❓ [${requestId}] Need follow-up:`, {
    question: followUp.question,
    chips: followUp.chips,
    missingField: missing[0],
  });

  res.status(200).json({
    status: "need_follow_up",
    sessionId,
    partial: merged,
    follow_up: followUp,
  });
}
