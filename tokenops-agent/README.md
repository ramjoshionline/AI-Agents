# TokenOps Agent — AI Cost Intelligence

A single-page HTML prototype demonstrating autonomous AI cost governance through a rule-based supervisory agent. No build toolchain, no CDN dependencies — just open `index.html` in any modern browser.

## What It Does

TokenOps Agent simulates real-time AI API request traffic across three use cases, routes requests through an in-browser gateway, and runs a rule-based supervisory agent that detects cost anomalies and intervenes autonomously. All simulation is deterministic and reproducible via seeded RNGs, making it ideal for demos and walkthroughs.

## Features

- **5 Dashboard Tabs**: Overview, Live Stream, Agent Console, Scenarios, Executive Summary
- **3 Simulated Use Cases**: Document Summarizer, Support Copilot, Proposal Assistant
- **5 AI Models**: Claude 3 Opus, GPT-4 Turbo, Claude 3 Sonnet, GPT-3.5 Turbo, Claude 3 Haiku
- **Real-time rule engine** with 4 policy rules, per-rule cooldown management, and severity levels
- **Autonomous interventions**: context trimming, model re-routing, cache activation, circuit breaking
- **Microcent cost arithmetic** to prevent float drift across thousands of requests
- **Seeded deterministic RNG** (Mulberry32) for fully reproducible scenario demonstrations
- **Dark / light theme** toggle via CSS custom properties
- **One-click reset** clears all state, re-seeds scenario RNG, and re-enables all controls

## Scenarios

| Scenario | Use Case | Anomaly | Agent Action |
|---|---|---|---|
| **Prompt Bloat** | doc-summarizer | 6–12k input tokens (policy: ≤2k) | Activate context trimming + cache reuse |
| **Premium Over-Routing** | support-copilot | GPT-4 Turbo instead of GPT-3.5 | Re-route to standard tier (20x cheaper) |
| **Retry Storm** | proposal-assistant | 4–8 retries per request (policy: ≤3) | Open circuit breaker, suspend workflow |

Each scenario progresses through a 5-stage lifecycle: Anomaly Building → Agent Detecting → Intervention Applied → Behavior Normalized → Complete.

## Policy Rules

- `MAX_DOC_SUMMARIZER_INPUT` — Maximum 2,000 input tokens per doc-summarizer request
- `SUPPORT_COPILOT_MAX_MODEL_TIER` — Support Copilot must use standard or economy tier models
- `MAX_RETRIES_PER_REQUEST` — Workflows exceeding 3 retries trigger automatic circuit breaker
- Spend-rate anomaly detection — alerts when recent 10-request spend is 2× above the first half

## Model Pricing Reference

| Model | Input (per 1k) | Output (per 1k) | Tier |
|---|---|---|---|
| Claude 3 Opus | $0.015 | $0.075 | premium |
| GPT-4 Turbo | $0.010 | $0.030 | premium |
| Claude 3 Sonnet | $0.003 | $0.015 | standard |
| GPT-3.5 Turbo | $0.0005 | $0.0015 | standard |
| Claude 3 Haiku | $0.00025 | $0.00125 | economy |

## Running Locally

```bash
# Open directly in browser — no server needed
open tokenops-agent/index.html

# Or serve via a simple static server
python3 -m http.server 8080
# then visit http://localhost:8080/tokenops-agent/index.html
```

## Architecture

All logic is contained in a single `index.html` file (~2200 lines):

- **Simulation engine** — `setInterval(simulationTick, 1200)`: generates requests, runs rules engine
- **Render loop** — `setInterval(renderActivePanel, 300)`: renders only the active tab each frame
- **Seeded RNG** — two Mulberry32 instances: `baselineRng` (seed 100, never reset) and `scenarioRng` (seed 42, reset on each scenario trigger)
- **Cost storage** — all costs stored as integer microcents; divided by 1,000,000 only at display time
- **State** — single mutable `state` object; `resetAll()` reconstructs it from `buildInitialState()`
- **Visibility API** — simulation pauses when tab is hidden to prevent state drift
- **Theming** — CSS custom properties; `[data-theme="light"]` overrides the default dark palette
