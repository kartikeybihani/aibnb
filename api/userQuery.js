// api/userQuery.js
// Node 18 on Vercel
// npm i @anthropic-ai/sdk zod

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ----- Types with Zod to validate intake coming from the model -----
const IntakeSchema = z.object({
  destinations: z
    .array(
      z.object({
        city: z.string().min(1),
        region: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .min(1)
    .optional(), // allow missing before merge
  dates: z
    .object({
      start: z.string().optional(), // ISO yyyy-mm-dd
      end: z.string().optional(),
    })
    .optional(),
  trip_length_days: z.number().int().positive().optional(),
  party: z
    .object({
      adults: z.number().int().nonnegative().optional(),
      kids: z.number().int().nonnegative().optional(),
    })
    .optional(),
  budget: z
    .object({
      level: z.enum(["low", "medium", "high"]).optional(),
      per_person_daily_usd: z.number().positive().optional(),
    })
    .optional(),
  vibe: z
    .object({
      pace: z.enum(["relaxed", "balanced", "adventurous"]).optional(),
      themes: z.array(z.string()).optional(),
    })
    .optional(),
  travel_dates_for_seasonality: z.boolean().optional(),
  dietary: z.array(z.string()).optional(),
  extras: z.record(z.unknown()).optional(),
});

const REQUIRED_KEYS = [
  "destinations",
  "trip_length_or_dates",
  "party_size",
  "budget",
  "vibe",
];

// ----- HTTP handler -----
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only" });
      return;
    }

    const {
      userText, // string with the users message
      partialIntake, // optional Intake gathered so far
      sessionId, // optional string for your own tracking
    } = req.body || {};

    if (!userText && !partialIntake) {
      res.status(400).json({ error: "Provide userText or partialIntake" });
      return;
    }

    // 1 Extract a fresh Intake from the new user text using Anthropic
    const extracted = userText ? await extractIntakeFromText(userText) : {};

    // 2 Merge with whatever the client already had
    const merged = normalizeIntake(
      deepMergeIntake(partialIntake || {}, extracted)
    );

    // 3 Decide if we can proceed or need a follow up
    const missing = findMissing(merged);

    // 4 Special multi city day split suggestion
    const extraFollowUp =
      !missing.length &&
      Array.isArray(merged.destinations) &&
      merged.destinations.length > 1 &&
      !merged?.extras?.day_split
        ? {
            question:
              "Do you want to split days across cities or should I spread them evenly",
            chips: [
              "Even split",
              "Rome 3 Florence 2 Venice 3",
              "I will specify",
            ],
          }
        : null;

    if (!missing.length && !extraFollowUp) {
      res.status(200).json({
        status: "ready",
        sessionId,
        intake: merged,
      });
      return;
    }

    const followUp = extraFollowUp || buildFollowUp(missing[0], merged);

    res.status(200).json({
      status: "need_follow_up",
      sessionId,
      partial: merged,
      follow_up: followUp,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err?.message || err) });
  }
}

// ----- Anthropic extraction -----
async function extractIntakeFromText(userText) {
  // Ask Claude to strictly emit JSON matching our shape
  const system = `
You are a travel intake parser.
Return strictly valid JSON that matches this TypeScript shape:

type Intake = {
  destinations: Array<{ city: string; region?: string; country?: string }>;
  dates?: { start?: string; end?: string };
  trip_length_days?: number;
  party: { adults: number; kids?: number };
  budget: { level?: "low" | "medium" | "high"; per_person_daily_usd?: number };
  vibe: { pace: "relaxed" | "balanced" | "adventurous"; themes?: string[] };
  travel_dates_for_seasonality?: boolean;
  dietary?: string[];
  extras?: Record<string, unknown>;
};

Rules
- Never invent facts
- If a detail is not explicit but strongly implied, include it and add an extras.assumptions array explaining the inference
- If the user gives nights convert to days nights plus one
- If the user gives total budget divide into per person per day and record the math in extras.assumptions
- Normalize synonyms
  - cheap student budget -> level low
  - upscale fine dining -> level high
  - chill easy slow -> pace relaxed
  - thrill hike intense -> pace adventurous
- Dates must be ISO yyyy-mm-dd when present
- Put anything that does not fit a known field into extras`.trim();

  const jsonSchema = {
    name: "IntakeExtraction",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: IntakeJsonSchemaProps(),
      required: [], // we allow partial and will merge and validate later
    },
  };

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1200,
    system,
    response_format: { type: "json_schema", json_schema: jsonSchema },
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

  const txt = msg?.content?.[0]?.text || "{}";
  // Validate and coerce to our Intake shape
  const parsed = safeParse(IntakeSchema, JSON.parse(txt));
  return parsed;
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
      properties: {
        start: { type: "string" },
        end: { type: "string" },
      },
    },
    trip_length_days: { type: "number" },
    party: {
      type: "object",
      additionalProperties: false,
      properties: {
        adults: { type: "number" },
        kids: { type: "number" },
      },
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
        themes: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    travel_dates_for_seasonality: { type: "boolean" },
    dietary: {
      type: "array",
      items: { type: "string" },
    },
    extras: {
      type: "object",
      additionalProperties: true,
    },
  };
}

// ----- Merge and normalize -----
function deepMergeIntake(base = {}, add = {}) {
  const out = JSON.parse(JSON.stringify(base || {}));
  const put = (k, v) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) out[k] = v.length ? v : out[k];
    else if (typeof v === "object") out[k] = { ...(out[k] || {}), ...v };
    else out[k] = v;
  };
  for (const [k, v] of Object.entries(add || {})) put(k, v);
  // ensure arrays exist
  if (out.destinations && !Array.isArray(out.destinations)) {
    out.destinations = [out.destinations];
  }
  if (!out.extras) out.extras = {};
  return out;
}

function normalizeIntake(intake) {
  const x = JSON.parse(JSON.stringify(intake || {}));
  // derive trip_length_days from dates if possible
  if (
    (!x.trip_length_days || x.trip_length_days <= 0) &&
    x?.dates?.start &&
    x?.dates?.end
  ) {
    const days = diffDaysISO(x.dates.start, x.dates.end);
    if (days > 0) {
      x.trip_length_days = days;
      x.travel_dates_for_seasonality = true;
    }
  }
  // map budget synonyms inside extras if present
  if (x?.budget?.level) {
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
  // trim themes
  if (x?.vibe?.themes) {
    x.vibe.themes = Array.from(
      new Set(
        x.vibe.themes.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
      )
    );
  }
  return safeParse(IntakeSchema, x);
}

function diffDaysISO(a, b) {
  try {
    const d1 = new Date(a + "T00:00:00Z");
    const d2 = new Date(b + "T00:00:00Z");
    const ms = d2 - d1;
    const days = Math.round(ms / 86400000);
    return days;
  } catch {
    return 0;
  }
}

function findMissing(x) {
  const misses = [];
  if (!x?.destinations || !x.destinations.length) misses.push("destinations");

  const hasDates = !!(x?.dates?.start && x?.dates?.end);
  const hasDays =
    Number.isFinite(x?.trip_length_days) && x.trip_length_days > 0;
  if (!hasDates && !hasDays) misses.push("trip_length_or_dates");

  const adults = x?.party?.adults;
  if (!(Number.isFinite(adults) && adults > 0)) misses.push("party_size");

  const hasBudget =
    (x?.budget && !!x.budget.level) ||
    (x?.budget && Number.isFinite(x.budget.per_person_daily_usd));
  if (!hasBudget) misses.push("budget");

  const pace = x?.vibe?.pace;
  if (!pace) misses.push("vibe");

  return misses;
}

function buildFollowUp(kind, x) {
  if (kind === "destinations") {
    return {
      question: "Where are you going",
      chips: ["Tokyo", "Kyoto", "Osaka", "Rome", "Florence", "Venice"],
    };
  }
  if (kind === "trip_length_or_dates") {
    return {
      question: "How long is the trip or what are the exact dates",
      chips: ["3 days", "5 days", "7 days", "Enter dates"],
    };
  }
  if (kind === "party_size") {
    return {
      question: "How many people are going adults and kids",
      chips: ["Solo", "Two adults", "Two adults one kid", "Four adults"],
    };
  }
  if (kind === "budget") {
    return {
      question: "What budget level should I plan for or daily spend per person",
      chips: ["Low", "Medium", "High"],
    };
  }
  if (kind === "vibe") {
    return {
      question: "What vibe fits best",
      chips: ["Relaxed", "Balanced", "Adventurous"],
    };
  }
  return { question: "Any other key detail", chips: [] };
}

function safeParse(schema, value) {
  const r = schema.safeParse(value || {});
  if (r.success) return r.data;
  // if model sends extras we cannot validate ignore errors by pruning unknowns
  return schema.parse(JSON.parse(JSON.stringify(value || {})));
}
