# ⚖️ Idea Interrogator

> **"Your idea is on trial. Can it survive the questions?"**

Stress-test any project or startup idea with three AI critics in a single pass:
- 💰 **Skeptical Investor** (Commercial viability & monetization)
- 👤 **Confused First-Time User** (Clarity, value proposition & onboarding)
- 🔍 **Ruthless QA Tester** (Edge cases, failure modes & technical risks)

---

## 🏛️ Interrogation Architecture & Workflow

### 1. End-to-End System Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Founder as Founder / User
    participant UI as React Frontend (Vite)
    participant API as Express API Server
    participant Validator as Input & Schema Validator
    participant AI as Google GenAI / Gemma 4 Engine

    Founder->>UI: Inputs idea (10–1500 chars) & selects category
    UI->>UI: Client validation (character counter, non-empty)
    Founder->>UI: Clicks "Interrogate My Idea"
    UI->>UI: Transition to Loading State (Animated Pulse)
    UI->>API: POST /api/interrogate { idea, category }

    API->>Validator: Validate payload & category
    alt Validation Failure (<10 chars or invalid category)
        Validator-->>API: 422 Unprocessable Entity
        API-->>UI: Error response JSON
        UI-->>Founder: Show contextual warning banner
    else Validation Success
        API->>AI: Generate Content with Structured Prompt
        Note over API,AI: Single model request generates<br/>all 3 critics + risk + action plan
        AI-->>API: Raw JSON model response
        API->>Validator: Parse & validate JSON contract shape
        Validator-->>API: Validated critique object
        API-->>UI: 200 OK with full evaluation payload
        UI->>UI: Transition to Results State
        UI-->>Founder: Render interactive Critic Cards, Blind Spot & Action Plan
    end
```

---

### 2. The Interrogation Tribunal Framework

```mermaid
flowchart TD
    subgraph INPUT["Input Phase"]
        UserIdea["Founder Idea\n(Web App / AI Tool / Dev Tool / Education / Other)"]
    end

    subgraph ENGINE["Interrogation Engine"]
        EngineNode["Gemma 4 Structured Synthesis\nPrompt with Zero-Shot Constraints"]
    end

    subgraph TRIBUNAL["The Three Critics"]
        Investor["💰 Skeptical Investor\n• Commercial defensibility\n• Willingness to pay\n• Acquisition channels\n• De-risking steps"]
        EndUser["👤 Confused First-Time User\n• 10-second value clarity\n• Onboarding friction points\n• Retention & stickiness\n• Usability simplification"]
        QATester["🔍 Ruthless QA Tester\n• Edge case failure paths\n• Scalability assumptions\n• Concurrent load behavior\n• Pre-launch test priorities"]
    end

    subgraph SYNTHESIS["Verdict & Survival Strategy"]
        RiskScore{"⚡ Overall Risk Level\n(Low / Medium / High)"}
        BlindSpot["⚠️ Biggest Blind Spot\nMost dangerous overlooked assumption"]
        ActionPlan["🗺️ 3-Step Survival Plan\nPrioritized next actions before writing code"]
    end

    UserIdea --> EngineNode
    EngineNode --> Investor
    EngineNode --> EndUser
    EngineNode --> QATester

    Investor --> RiskScore
    EndUser --> RiskScore
    QATester --> RiskScore

    RiskScore --> BlindSpot
    BlindSpot --> ActionPlan

    classDef primary fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#ffffff;
    classDef critic fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#ffffff;
    classDef outcome fill:#18181b,stroke:#f59e0b,stroke-width:2px,color:#ffffff;
    class EngineNode primary;
    class Investor,EndUser,QATester critic;
    class RiskScore,BlindSpot,ActionPlan outcome;
```

---

## 🎯 Key Features

- **Triad Critique in One Request**: Simultaneously queries three adversarial perspectives without three separate round trips, keeping latency low.
- **Strict Structured JSON**: Guaranteed JSON schema featuring verdicts, 3 hard interrogation questions per critic, core concerns, and concrete recommendations.
- **Synthesized Blind Spot & Action Plan**: Unearths the single biggest blind spot across all perspectives and outputs an actionable 3-step roadmap.
- **Secure Key Isolation**: API keys remain strictly confined to the backend server in `server/.env` and are never exposed to browser bundles.
- **Interactive High-Contrast UI**: Expandable cards, one-click demo presets, live character count validation, and resilient error recovery.

---

## 📊 Structured Response Contract

The backend expects and produces the following structured JSON contract:

```json
{
  "ideaTitle": "Short descriptive title (5 words max)",
  "summary": "One-sentence description of the idea",
  "critics": [
    {
      "id": "investor",
      "verdict": "Short verdict from a Skeptical Investor (1-2 sentences)",
      "questions": [
        "Hard commercial question 1",
        "Hard commercial question 2",
        "Hard commercial question 3"
      ],
      "biggestConcern": "The single biggest commercial or sustainability risk",
      "recommendation": "One concrete next step to de-risk this commercially"
    },
    {
      "id": "user",
      "verdict": "Short verdict from a Confused First-Time User (1-2 sentences)",
      "questions": [
        "Usability question 1",
        "Usability question 2",
        "Usability question 3"
      ],
      "biggestConcern": "The single biggest usability or clarity problem",
      "recommendation": "One concrete change that would make this immediately clearer"
    },
    {
      "id": "qa",
      "verdict": "Short verdict from a Ruthless QA Tester (1-2 sentences)",
      "questions": [
        "Edge case question 1",
        "Edge case question 2",
        "Edge case question 3"
      ],
      "biggestConcern": "The single riskiest technical assumption or failure mode",
      "recommendation": "One concrete thing to test or validate first"
    }
  ],
  "overallRisk": "Low | Medium | High",
  "biggestBlindSpot": "The most important overlooked weakness across all perspectives",
  "actionPlan": [
    "First action to take",
    "Second action to take",
    "Third action to take"
  ]
}
```

---

## 📂 Project Structure

```text
├── client/                      # Frontend application (React 19 + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── CriticCard.jsx   # Expandable interactive critic component
│   │   ├── App.jsx              # Main state machine (Landing/Loading/Results/Error)
│   │   ├── App.css              # Custom responsive dark-theme design system
│   │   └── main.jsx             # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js           # Includes dev proxy to Express API
├── server/                      # Backend application (Node.js + Express)
│   ├── index.js                 # API route, schema validation, prompt & AI client
│   ├── package.json
│   └── .env                     # Private environment variables (API Key)
├── .env.example                 # Template for required environment variables
├── Agents.md                    # Project requirements and constraint spec
└── README.md                    # System documentation and architectural diagrams
```

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm or pnpm

### 1. Environment Setup

Create a `.env` file in the `server` directory:

```bash
# On Windows PowerShell:
Copy-Item .env.example server\.env

# On macOS/Linux:
cp .env.example server/.env
```

Open `server/.env` and insert your API key:
```env
GEMINI_API_KEY=your_gemini_or_gemma_api_key_here
PORT=3001
```

### 2. Install Dependencies

In two separate terminals:

```bash
# Terminal 1: Backend
cd server
npm install

# Terminal 2: Frontend
cd client
npm install
```

### 3. Run the Application

```bash
# Terminal 1: Start Backend
cd server
npm start
# Server listens at http://localhost:3001

# Terminal 2: Start Frontend
cd client
npm run dev
# App opens at http://localhost:5173
```

---

## 🛡️ Safety & AI Disclaimer

- **Hypothesis, Not Fact**: All critiques, risk ratings, and recommendations are algorithmic hypotheses designed to prompt critical thinking, not legal, financial, or engineering guarantees.
- **Safety Filtering**: The backend sets `BLOCK_NONE` thresholds specifically to allow rigorous adversarial business critiques without accidental false-positive safety triggers.
