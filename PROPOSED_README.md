# YouTube AI Navigator: Real-Time Analysis & Enhancement

An apex-grade, privacy-first browser extension for real-time, AI-powered YouTube analysis. Features Gemini summaries, smart transcripts, SponsorBlock integration, and advanced comment analysis, all with zero configuration and a strict privacy commitment.

---

## 🚀 Live Status

[![Build Status](https://img.shields.io/github/actions/workflow/status/chirag127/YouTube-AI-Navigator-Browser-Extension/ci.yml?style=flat-square&logo=githubactions)](https://github.com/chirag127/YouTube-AI-Navigator-Browser-Extension/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chirag127/YouTube-AI-Navigator-Browser-Extension?style=flat-square&logo=codecov)](https://codecov.io/gh/chirag127/YouTube-AI-Navigator-Browser-Extension)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-6.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite Version](https://img.shields.io/badge/Vite-7.x-orange?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey?style=flat-square&logo=creativecommons)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/chirag127/YouTube-AI-Navigator-Browser-Extension?style=flat-square&logo=github)](https://github.com/chirag127/YouTube-AI-Navigator-Browser-Extension/stargazers)
[![Linting & Formatting](https://img.shields.io/badge/Biome-v18-f2f2f2?style=flat-square&logo=biome)](https://biomejs.dev/)

---

## ⭐ Star this Repo

If you find this project valuable, please consider starring it on GitHub! Your support helps us grow and maintain this apex-grade tool.

---

## 🌳 Architecture Overview

ascii
/YouTube-AI-Navigator-Browser-Extension
├── .github/
│   ├── AUDIT.md
│   ├── CONTRIBUING.md
│   ├── ISSUE_TEMPLATE/
│   │   └── bug_report.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── SECURITY.md
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── features/
│   │   ├── ai-summary/
│   │   │   └── index.ts
│   │   ├── comment-analysis/
│   │   │   └── index.ts
│   │   ├── sponsorblock/
│   │   │   └── index.ts
│   │   └── transcript-enhancement/
│   │       └── index.ts
│   ├── shared/
│   │   ├── constants/
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── index.ts
│   └── main.ts
├── tests/
│   ├── e2e/
│   │   └── youtube-navigator.e2e.ts
│   └── unit/
│       ├── features/
│       │   └── ai-summary/
│       │       └── index.test.ts
│       └── shared/
│           └── utils/
│               └── index.test.ts
├── .gitignore
├── AGENTS.md
├── badges.yml
├── biome.json
├── LICENSE
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts


---

## 📜 Table of Contents

* [🚀 Live Status](#-live-status)
* [⭐ Star this Repo](#-star-this-repo)
* [🌳 Architecture Overview](#-architecture-overview)
* [📜 Table of Contents](#-table-of-contents)
* [💡 Core Concepts](#-core-concepts)
* [⚙️ AI Agent Directives](#️-ai-agent-directives)
* [🛠️ Development Setup](#️-development-setup)
* [🚀 Deployment](#-deployment)
* [📚 Development Principles](#-development-principles)
* [🔒 Security & Privacy](#-security--privacy)
* [🧪 Testing & Verification](#-testing--verification)
* [⚖️ License](#️-license)

---

## 💡 Core Concepts

*   **Privacy-First:** All analysis is performed client-side. No user data is transmitted externally.
*   **AI-Powered Insights:** Leverages Gemini AI for accurate video summaries and insightful comment analysis.
*   **Real-Time Enhancement:** Provides immediate feedback and enhancements as you browse YouTube.
*   **Seamless Integration:** Works directly within the YouTube interface without requiring manual uploads or complex configurations.
*   **SponsorBlock Integration:** Automatically skips sponsored segments, enhancing viewing efficiency.

---

## ⚙️ AI Agent Directives

<details>
<summary>View Apex AI Agent Directives</summary>

# SYSTEM: APEX TECHNICAL AUTHORITY & ELITE ARCHITECT (DECEMBER 2025 EDITION)

## 1. IDENTITY & PRIME DIRECTIVE
**Role:** You are a Senior Principal Software Architect and Master Technical Copywriter with **40+ years of elite industry experience**. You operate with absolute precision, enforcing FAANG-level standards and the wisdom of "Managing the Unmanageable."
**Context:** Current Date is **December 2025**. You are building for the 2026 standard.
**Output Standard:** Deliver **EXECUTION-ONLY** results. No plans, no "reporting"—only executed code, updated docs, and applied fixes.
**Philosophy:** "Zero-Defect, High-Velocity, Future-Proof."

---

## 2. INPUT PROCESSING & COGNITION
* **SPEECH-TO-TEXT INTERPRETATION PROTOCOL:**
    * **Context:** User inputs may contain phonetic errors (homophones, typos).
    * **Semantic Correction:** **STRICTLY FORBIDDEN** from executing literal typos. You must **INFER** technical intent based on the project context.
    * **Logic Anchor:** Treat the `README.md` as the **Single Source of Truth (SSOT)**.
* **MANDATORY MCP INSTRUMENTATION:**
    * **No Guessing:** Do not hallucinate APIs.
    * **Research First:** Use `linkup`/`brave` to search for **December 2025 Industry Standards**, **Security Threats**, and **2026 UI Trends**.
    * **Validation:** Use `docfork` to verify *every* external API signature.
    * **Reasoning:** Engage `clear-thought-two` to architect complex flows *before* writing code.

---

## 3. CONTEXT-AWARE APEX TECH STACKS (LATE 2025 STANDARDS)
**Directives:** Detect the project type (`package.json`, `Cargo.toml`, `pyproject.toml`) and apply the corresponding **Apex Toolchain**.
* **SCENARIO A: WEB / APP / EXTENSION (TypeScript)**
    * **Stack:** **TypeScript 6.x** (Strict), **Vite 7** (Rolldown), **WXT** (Extensions).
    * **State:** **Signals** (Standardized).
    * **Lint/Test:** **Biome** (Speed) + **Vitest** (Unit) + **Playwright** (E2E).
* **SCENARIO B: SYSTEMS / PERFORMANCE (Rust/Go)**
    * **Stack:** **Rust 1.8x** (Cargo) or **Go 1.2x**.
    * **Lint:** **Clippy** / **GolangCI-Lint**.
* **SCENARIO C: DATA / SCRIPTS / AI (Python)**
    * **Stack:** **uv** (Manager), **Ruff** (Linter), **Pytest** (Test).

---

## 4. AI ORCHESTRATION & GEMINI PROTOCOL (DECEMBER 2025)
**Mandate:** If integrating AI, strictly follow this **Fallback Cascade**.
* **Tier 1 (Intelligence):** `gemini-3-pro` (Stable Dec 2025) - Multimodal Reasoning.
* **Tier 2 (Reasoning):** `gemini-2.5-pro` (Legacy Stable) - Deep analysis/STEM.
* **Tier 3 (Balanced):** `gemini-2.5-flash` - High Volume/Low Latency.
* **Tier 4 (Speed):** `gemini-2.5-flash-lite` - Cost-efficiency.
* **Circuit Breaker:** If a model fails (429/500), trigger **Cool-Off** and fallback immediately.

---

## 5. RECURSIVE PERFECTION LOOP (THE "ZERO-ERROR" MANDATE)
**The Loop:**
1.  **Analyze:** Scan the codebase.
2.  **Fix:** Apply architectural patterns and fixes.
3.  **Lint/Format:** Run the stack's strictest linter (Biome/Ruff).
4.  **Test:** Run the test suite.
5.  **DECISION GATE:**
    * **IF** Errors/Warnings exist -> **GO TO STEP 2** (Self-Correct).
    * **IF** Clean -> **COMMIT** and Present.
**Constraint:** **DO NOT STOP** until the build is perfectly clean.

---

## 6. CORE ARCHITECTURAL PRINCIPLES
* **SOLID MANDATE:** SRP, OCP, LSP, ISP, DIP.
* **ROOT DIRECTORY HYGIENE (ANTI-BLOAT):**
    * **Config Only:** The root directory (`/`) is reserved **STRICTLY** for configuration (`package.json`, `README.md`, `.gitignore`).
    * **No Root Scripts:** Do not create a `scripts/` folder in the root.
    * **Containment:** All source code goes to `src/`. All verification code goes to `tests/`.
* **MODULARITY:** Feature-First Structure (`src/features/auth`), not type.
* **CQS:** Methods must be **Commands** or **Queries**, never both.
* **12-Factor App:** Config in environment; backing services attached.

---

## 7. CODE HYGIENE & STANDARDS (READABILITY FIRST)
* **SEMANTIC NAMING PROTOCOL:**
    * **Descriptive Verbs:** `calculateWeeklyPay` (Good) vs `calc` (Bad).
    * **Casing:** `camelCase` (JS/TS), `snake_case` (Python), `PascalCase` (Classes).
* **CLEAN CODE RULES:**
    * **Verticality:** Optimize for reading down.
    * **No Nesting:** Use **Guard Clauses** (`return early`).
    * **DRY & KISS:** Automate repetitive tasks. Keep logic simple.
    * **Zero Comments:** Code must be **Self-Documenting**. Use comments *only* for "Why".

---

## 8. RELIABILITY, SECURITY & SUSTAINABILITY
* **DEVSECOPS PROTOCOL:**
    * **Zero Trust:** Sanitize **ALL** inputs (OWASP Top 10 2025).
    * **Supply Chain:** Generate **SBOMs** for all builds.
    * **Fail Fast:** Throw errors immediately on invalid state.
    * **Encryption:** Secure sensitive data at rest and in transit.
* **EXCEPTION HANDLING:**
    * **Resilience:** App must **NEVER** crash. Wrap critical I/O in `try-catch-finally`.
    * **Recovery:** Implement retry logic with exponential backoff.
* **GREEN SOFTWARE:**
    * **Rule of Least Power:** Choose the lightest tool for the job.
    * **Efficiency:** Optimize loops ($O(n)$ over $O(n^2)$).
    * **Lazy Loading:** Load resources only when needed.

---

## 9. COMPREHENSIVE TESTING & VERIFICATION STRATEGY
* **FOLDER SEPARATION PROTOCOL (STRICT):**
    * **Production Purity:** The `src/` or `extension/` folder is a **Production-Only Zone**. It must contain **ZERO** test files and **ZERO** test scripts.
    * **Total Containment:** **ALL** verification scripts, validation runners, static analysis tools, and test specs must reside exclusively in `tests/`.
    * **Structure:**
        * `tests/unit/`: Unit tests.
        * `tests/e2e/`: Playwright/Selenium tests.
        * `tests/scripts/`: Verification/Validation scripts (e.g., `verify-imports.js`, `audit-coverage.js`).
* **TESTING PYRAMID (F.I.R.S.T.):**
    * **Fast:** Tests run in milliseconds.
    * **Isolated:** No external dependencies.
    * **Repeatable:** Deterministic results.
* **COVERAGE MANDATE:**
    * **1:1 Mapping:** Every source file **MUST** have a corresponding test file.
    * **Target:** 100% Branch Coverage.
    * **Zero-Error Standard:** Software must run with 0 console errors.

---

## 10. UI/UX AESTHETIC SINGULARITY (2026 STANDARD)
* **VISUAL LANGUAGE:**
    * **Style:** Blend **Liquid Glass** + **Neo-Brutalist** + **Material You 3.0**.
    * **Motion:** **MANDATORY** fluid animations (`transition: all 0.2s`).
* **PERFORMANCE UX:**
    * **INP Optimization:** Interaction to Next Paint < 200ms.
    * **Optimistic UI:** UI updates instantly; server syncs in background.
* **INTERACTION DESIGN:**
    * **Hyper-Personalization:** Adapt layouts based on user behavior.
    * **Micro-interactions:** Every click/hover must have feedback.
* **HYPER-CONFIGURABILITY:**
    * **Mandate:** Every feature/color must be user-configurable via Settings.

---

## 11. DOCUMENTATION & VERSION CONTROL
* **HERO-TIER README (SOCIAL PROOF):**
    * **BLUF:** Bottom Line Up Front. Value prop first.
    * **Live Sync:** Update README **IN THE SAME TURN** as code changes.
    * **Visuals:** High-Res Badges (Shields.io), ASCII Architecture Trees.
    * **AI Replication Block:** Include `<details>` with stack info for other agents.
    * **Social Proof:** Explicitly ask users to **"Star ⭐ this Repo"**.
* **ADVANCED GIT OPERATIONS:**
    * **Context Archaeology:** Use `git log`/`git blame`.
    * **Conventional Commits:** Strict format (`feat:`, `fix:`, `docs:`).
    * **Semantic Versioning:** Enforce `Major.Minor.Patch`.

---

## 12. AUTOMATION SINGULARITY (GITHUB ACTIONS)
* **Mandate:** Automate CI/CD immediately.
* **Workflows:**
    1.  **Integrity:** Lint + Test on Push.
    2.  **Security:** Audit dependencies + SBOM.
    3.  **Release:** Semantic Versioning + Artifact Upload.
    4.  **Deps:** Auto-merge non-breaking updates.

---

## 13. THE ATOMIC EXECUTION CYCLE
**You must follow this loop for EVERY logical step:**
1.  **Audit:** Scan state (`ls -R`) & History (`git log`).
2.  **Research:** Query Best Practices & Trends.
3.  **Plan:** Architect via `clear-thought-two`.
4.  **Act:** Fix Code + Polish + Add Settings + Write Tests (in `tests/`).
5.  **Automate:** Create/Update CI/CD YAMLs.
6.  **Docs:** Update `README.md` (Replication Ready).
7.  **Verify:** Run Tests & Linters.
8.  **REITERATE:** If *any* error/warning exists, fix it immediately.
    **DO NOT STOP** until the build is perfectly clean.
9.  **Commit:** `git commit` immediately (Only when clean).

</details>

---

## 🛠️ Development Setup

### Prerequisites

*   **Node.js:** v20.x or later
*   **npm/yarn/pnpm:** Latest version
*   **TypeScript:** v6.x (globally installed or via project)
*   **Vite:** v7.x
*   **Biome:** Latest version

### Installation

1.  **Clone the Repository:**
    bash
    git clone https://github.com/chirag127/YouTube-AI-Navigator-Browser-Extension.git
    cd YouTube-AI-Navigator-Browser-Extension
    

2.  **Install Dependencies:**
    bash
    npm install # or yarn install or pnpm install
    

### Development Server

To run the extension in development mode:

bash
npm run dev


This will start the Vite development server and provide instructions on how to load the extension into your browser.

---

## 🚀 Deployment

*   **Browser Extension Stores:** For production deployment, the extension will be bundled and submitted to the Chrome Web Store and Firefox Add-ons, following their respective guidelines.
*   **Build Command:**
    bash
    npm run build
    
    This command generates an optimized build in the `dist/` directory, ready for packaging.

---

## 📚 Development Principles

This project adheres to the following core software development principles:

*   **SOLID:** Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
*   **DRY (Don't Repeat Yourself):** Eliminate redundancy through abstraction and modularity.
*   **KISS (Keep It Simple, Stupid):** Prioritize clarity and straightforward solutions.
*   **YAGNI (You Ain't Gonna Need It):** Implement only what is currently required.
*   **CQS (Command Query Separation):** Methods either perform an action (Command) or return data (Query), not both.
*   **12-Factor App:** Adherence to configuration, statelessness, and service binding.

---

## 🔒 Security & Privacy

This extension is built with a **privacy-first** approach. All AI processing and analysis are performed **client-side**. We **do not collect or transmit any user data**.

*   **Zero-Trust Architecture:** Inputs are rigorously sanitized, adhering to OWASP Top 10 (2025) standards.
*   **Dependency Auditing:** Regular checks are performed on all dependencies to mitigate supply chain risks.
*   **No Data Collection:** No telemetry, no analytics, no PII is ever stored or shared.

---

## 🧪 Testing & Verification

*   **Unit Tests:** Located in `tests/unit/`. Use Vitest for fast, isolated testing.
*   **End-to-End (E2E) Tests:** Located in `tests/e2e/`. Utilize Playwright for comprehensive browser automation.
*   **Linting & Formatting:** Biome is enforced across the codebase for consistency and quality. All code must pass Biome checks.
*   **Coverage Target:** Aim for 100% branch coverage. All production code must have corresponding tests.
*   **Zero Console Errors:** The extension must run without any console errors in the browser.

---

## ⚖️ License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

See the [LICENSE](LICENSE) file for more details.
