--- 
name: Feature, Fix, or Refactor Request
about: Submit a pull request to enhance or fix the YouTube AI Navigator.
title: 'feat: Descriptive summary of changes (e.g., feat: Add Gemini 3.5 support to summaries)'
labels: ['needs review']
assignees: ['chirag127']
---

# 🚀 Pull Request: {{PR_TITLE_GOES_HERE}}

## Status
<!-- Mark the relevant box with an X -->
- [ ] 🚧 Work in Progress (WIP)
- [x] ✅ Ready for Review (RFC)

---

## 💡 Summary of Changes (BLUF)
*Please provide a concise, high-level overview of the changes introduced in this PR.*

This PR implements [X functionality] by [Y method], resolving issue #[Z]. Key improvements include [Performance gain, UI enhancement, or new feature] in the `YouTube-AI-Navigator-Browser-Extension`.

## 🔗 Related Issue
Closes # (Type the issue number this PR fixes or relates to)

## 📐 Type of Change
<!-- Mark all applicable changes with an X -->
- [ ] ✨ New Feature (Adds new functionality or component, e.g., new AI model integration)
- [ ] 🐞 Bug Fix (Fixes an existing issue in the current functionality)
- [ ] 🔨 Refactor/Code Quality (Code improvements without changing external behavior)
- [ ] 📚 Documentation Update (Updates to README, AGENTS.md, or inline docs)
- [ ] 🧪 Testing (Adds or updates unit/integration tests)
- [ ] 🛡️ Security Enhancement (Improvements related to content script isolation or manifest permissions)

---

## 📋 Standard 11 Compliance & Code Integrity Checklist
*Before submitting, ensure all standards are met. This checklist is mandatory.*

### 1. Code Quality & Standards
- [ ] **WXT Manifest:** Have all necessary permissions been correctly declared and minimalized in `manifest.config.ts`?
- [ ] **Typescript Strict:** Does the code compile without any type errors (`tsc --noEmit`)?
- [ ] **Linting & Formatting:** Has the code been formatted and linted using Biome? (Run `npm run lint:fix`)
- [ ] **E2E Validation:** Have all relevant Playwright E2E tests been updated and passed locally? (Run `npm run test:e2e`)

### 2. Architecture & Design Principles
- [ ] **FSD Adherence:** Do new components adhere to the Feature-Sliced Design (FSD) architecture defined in `AGENTS.md` (shared/entities/features/pages)?
- [ ] **SOLID/DRY:** Are components decoupled, following Single Responsibility Principle (SRP)? Is redundancy avoided?
- [ ] **Zero-Trust Input:** Are all content script inputs sanitized/validated, especially those interacting with the DOM or external APIs?

### 3. Security & Privacy
- [ ] **CSP Review:** Have Content Security Policy changes been thoroughly reviewed, particularly for remote AI endpoints?
- [ ] **Data Minimization:** Are we only accessing the necessary YouTube page data and minimizing state stored in browser storage?
- [ ] **Secret Handling:** Are all API keys (e.g., Gemini Key) loaded securely via runtime environment configuration and not hardcoded?

---

## 🧪 Testing Strategy
*Provide detailed instructions on how reviewers can test and verify these changes.*

**Setup Steps:**
1. Clone the branch: `git checkout <branch-name>`
2. Install dependencies: `npm install`
3. Start development build: `npm run dev`
4. Load the unpacked extension in a Chromium-based browser (e.g., Chrome/Brave).

**Verification Steps (Specific to this PR):**
1. Navigate to a typical YouTube video URL (e.g., `https://www.youtube.com/watch?v=...`).
2. Open the AI Navigator panel (usually via the extension toolbar icon).
3. Verify [specific new function/fix, e.g., transcript parsing, summary generation speed].
4. Check DevTools console for any unexpected warnings or errors in the background service worker or content scripts.

## ✍️ Reviewer Notes
*Are there specific files, complex logic, or edge cases you want the reviewer to pay extra attention to?*

- *Focus on files related to the specific feature/bug being addressed.*
- *If touching performance-critical path (e.g., DOM mutations), please highlight potential bottlenecks.*

---
_Thank you for contributing to **YouTube-AI-Navigator-Browser-Extension**!_