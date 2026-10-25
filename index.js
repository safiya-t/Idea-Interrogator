import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "16kb" }));

// ── Gemma client ─────────────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemma-4-26b-a4b-it";

// Disable safety filtering — critique prompts are business content, not harmful
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(idea, category) {
  return `You are running a structured startup idea review. Return ONLY valid JSON — no markdown fences, no explanation, no extra text before or after the JSON.

Idea: ${idea}
Category: ${category}

Return a JSON object with EXACTLY this shape:
{
  "ideaTitle": "Short descriptive title (5 words max)",
  "summary": "One-sentence description of the idea",
  "critics": [
    {
      "id": "investor",
      "verdict": "Short verdict from a Skeptical Investor (1-2 sentences)",
      "questions": ["Hard commercial question 1", "Hard commercial question 2", "Hard commercial question 3"],
      "biggestConcern": "The single biggest commercial or sustainability risk",
      "recommendation": "One concrete next step to de-risk this commercially"
    },
    {
      "id": "user",
      "verdict": "Short verdict from a Confused First-Time User (1-2 sentences)",
      "questions": ["Usability question 1", "Usability question 2", "Usability question 3"],
      "biggestConcern": "The single biggest usability or clarity problem",
      "recommendation": "One concrete change that would make this immediately clearer"
    },
    {
      "id": "qa",
      "verdict": "Short verdict from a Ruthless QA Tester (1-2 sentences)",
      "questions": ["Edge case question 1", "Edge case question 2", "Edge case question 3"],
      "biggestConcern": "The single riskiest technical assumption or failure mode",
      "recommendation": "One concrete thing to test or validate first"
    }
  ],
  "overallRisk": "Low",
  "biggestBlindSpot": "The most important overlooked weakness across all perspectives",
  "actionPlan": ["First action to take", "Second action to take", "Third action to take"]
}

Rules:
- overallRisk must be exactly one of: "Low", "Medium", "High"
- Do not invent market statistics or present speculation as verified fact
- Frame all critique as AI-generated hypotheses, not verified conclusions
- Return ONLY the JSON object. Nothing else.`;
}

// ── Validation ────────────────────────────────────────────────────────────────
const VALID_CATEGORIES = ["Web App", "AI Tool", "Developer Tool", "Education", "Other"];

function validateResult(data) {
  if (!data || typeof data !== "object") return false;
  if (typeof data.ideaTitle !== "string" || !data.ideaTitle) return false;
  if (typeof data.summary !== "string" || !data.summary) return false;
  if (!Array.isArray(data.critics) || data.critics.length !== 3) return false;
  const ids = ["investor", "user", "qa"];
  for (const critic of data.critics) {
    if (!ids.includes(critic.id)) return false;
    if (typeof critic.verdict !== "string") return false;
    if (!Array.isArray(critic.questions) || critic.questions.length !== 3) return false;
    if (typeof critic.biggestConcern !== "string") return false;
    if (typeof critic.recommendation !== "string") return false;
  }
  if (!["Low", "Medium", "High"].includes(data.overallRisk)) return false;
  if (typeof data.biggestBlindSpot !== "string") return false;
  if (!Array.isArray(data.actionPlan) || data.actionPlan.length !== 3) return false;
  return true;
}

function parseModelOutput(text) {
  // Strip markdown fences if the model wraps output
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  cleaned = cleaned.replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

// ── Route ─────────────────────────────────────────────────────────────────────
app.post("/api/interrogate", async (req, res) => {
  const { idea, category } = req.body ?? {};

  // Input validation
  if (!idea || typeof idea !== "string") {
    return res.status(422).json({ error: "idea is required." });
  }
  const trimmed = idea.trim();
  if (trimmed.length < 10) {
    return res.status(422).json({ error: "Idea is too short. Write at least 10 characters." });
  }
  if (trimmed.length > 1500) {
    return res.status(422).json({ error: "Idea is too long. Keep it under 1500 characters." });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(422).json({ error: "Please select a valid category." });
  }

  // ── Mock response (user-requested: Gemma unavailable on this API key) ────────
  const mock = buildMockResponse(trimmed, category);
  console.log(`[mock] Returning mock critique for: "${trimmed.slice(0, 60)}..."`);
  return res.json(mock);
});

// ── Mock response builder ─────────────────────────────────────────────────────
// Produces varied, realistic-looking critique data using the actual idea text.
function buildMockResponse(idea, category) {
  const words = idea.split(/\s+/);
  const titleWords = words.slice(0, 5).join(" ");
  const risks = ["Low", "Medium", "High"];
  const risk = risks[words.length % 3];

  return {
    ideaTitle: titleWords.length > 3 ? titleWords : `${category} Idea`,
    summary: `A ${category.toLowerCase()} that aims to ${idea.slice(0, 80).toLowerCase()}…`,
    critics: [
      {
        id: "investor",
        verdict: "Interesting space, but the path to sustainable revenue is unclear from this description alone.",
        questions: [
          "Who is the paying customer, and what is their current alternative to your solution?",
          "What does the acquisition funnel look like — organic, paid, or partnership-driven?",
          "How defensible is this once a well-funded competitor copies the core feature?",
        ],
        biggestConcern: "Without a clear monetisation model, this risks becoming a free tool that attracts users but cannot sustain a team.",
        recommendation: "Before building, interview 10 potential paying customers and validate willingness to pay with a pre-order or LOI.",
      },
      {
        id: "user",
        verdict: "I can see what this does, but I am not sure why I would choose it over what I already use.",
        questions: [
          "Within 10 seconds of landing on the page, would I know exactly what this does and why it is for me?",
          "What happens the first time something does not work as I expected — is there a clear path forward?",
          "Why would I come back next week instead of using it once and forgetting about it?",
        ],
        biggestConcern: "The onboarding experience is untested — first-time users will hit friction points that seem obvious in retrospect but are invisible to the founder.",
        recommendation: "Run a 5-person unmoderated usability test before launch and watch where people pause or go silent.",
      },
      {
        id: "qa",
        verdict: "Several critical failure paths have not been addressed, and the riskiest assumptions are baked in from day one.",
        questions: [
          `What happens when the core ${category.toLowerCase()} workflow encounters unexpected or malformed input?`,
          "How does the system behave under concurrent load — has any load testing been done at all?",
          "What is the rollback plan if a bad deployment reaches production users?",
        ],
        biggestConcern: "The riskiest technical assumption is that the happy path will hold in production — edge cases discovered post-launch are significantly more expensive to fix.",
        recommendation: "Define and document at least five failure scenarios before writing a single line of production code, and build alerting for each one.",
      },
    ],
    overallRisk: risk,
    biggestBlindSpot:
      "The biggest unaddressed weakness is the gap between 'works in a demo' and 'works reliably for real users at scale' — no plan exists yet for monitoring, recovery, or iteration once the product is live.",
    actionPlan: [
      `Validate the core assumption: speak to 10 real potential users this week and ask about their current workflow, not about your solution.`,
      `Build the smallest possible version that delivers one clear outcome — skip everything that does not directly support that outcome.`,
      `Define success metrics before launch: one north-star metric, one retention signal, and one early warning indicator for churn.`,
    ],
  };
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Idea Interrogator server running on http://localhost:${PORT}`);
});
