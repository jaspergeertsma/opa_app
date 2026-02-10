# README-AI.md

## 🤖 AI Developer Handover Document

**Project:** `opa_app` (Oud Papier Planner)
**Context:** This file serves as the definitive guide for any AI assistant working on this repository. It encapsulates the agreed-upon workflows, architectural choices, and strict quality standards.

---

## 🔄 Development Workflow: Trunk-Based Light

We strictly follow a modified trunk-based development workflow to ensure stability and controlled releases.

### 1. Branching Strategy
*   **`main`**: **Production**. Always stable, deployable. ONLY updated via Pull Requests from `dev`.
*   **`dev`**: **Integration**. The main working branch where all new features land.
*   **`feature/<name>`**: **Task-specific**. Created from `dev`. Short-lived.
*   **`hotfix/<name>`**: Critical fixes. Created from `main`, merged to `main` AND `dev`.

### 2. Daily Flow
1.  **Start Task**: `git checkout dev`, `git pull`, `git checkout -b feature/my-cool-feature`.
2.  **Iterate**: Commit often. Code must be clean and self-contained.
3.  **Deployment Check**: If a commit does NOT affect the build (e.g., docs, tests), append `[skip netlify]` to the commit message to save build minutes.
4.  **Pre-PR Quality Gate**:
    *   Run **Smoke Tests**: `npm run test:smoke`.
    *   **Manual Sanity Check**: Verify the app loads and key flows (login) work.
5.  **Pull Request**:
    *   Push to origin.
    *   Create PR targeting `dev`.
    *   Fill out the **PR Template** (checklists are mandatory).
6.  **Merge**:
    *   **Squash Merge** into `dev` to keep history clean.
    *   Ensure the commit message describes the *feature* clearly.

### 3. Release Process (dev -> main)
Releases are conscious decisions, not automatic.
1.  **Preparation**: Ensure `dev` is stable.
2.  **Versioning**:
    *   Update version in `package.json` (e.g., `0.1.2` -> `0.2.0`). **Note**: The UI automatically reads this version in `DashboardLayout.tsx`.
    *   Update `CHANGELOG.md` under `[Unreleased]` -> `[vX.Y.Z]`.
3.  **Pull Request**: Open PR from `dev` -> `main` titled "Release vX.Y.Z".
4.  **Tag**: After merge, create a git tag: `git tag vX.Y.Z` and push it (`git push origin vX.Y.Z`).

---

## 🧪 Quality & Testing

*   **Smoke Test**: Minimal verification script using `vitest`.
    *   Command: `npm run test:smoke`
    *   Scope: Verifies app renders, title is correct, critical buttons exist.
*   **Manual**: AI should verify logic changes where possible or ask USER to verify specific complex flows.

---

## 🛠 Tech Stack & Architecture

*   **Frontend**: React (Vite) + TypeScript.
*   **Styling**: Vanilla CSS with comprehensive variables (in `index.css`).
    *   **Aesthetics**: "Rich", modern, dark-green branding, glassmorphism touches. Avoid generic UI.
*   **Backend/DB**: Supabase (PostgreSQL).
    *   **Local Dev**: Uses `VITE_USE_MOCK=true` by default to mock Supabase calls in memory.
*   **Hosting**: Netlify.
    *   **Functions**: Netlify Functions (`netlify/functions/*.ts`) for server-side logic (emails, reminders).

---

## 📝 Documentation & maintenance

*   **`CHANGELOG.md`**: Must be kept up to date with every meaningful change.
*   **`package.json`**: The source of truth for the application version.
*   **Versioning**: Semantic Versioning (SemVer).

---

## ⚠️ Special Instructions for AI

1.  **Do NOT break production**. Always use the `dev` branch for changes.
2.  **Check Context**: Before writing code, check `CHANGELOG.md` and active branches to understand the current state.
3.  **Aesthetics**: If the user asks for a UI change, ensure it looks *premium*. Don't settle for browser defaults.
4.  **Communication**: Be proactive but concise. Confirm critical actions (like deployments or large refactors).

This document is your primary directive. Follow it rigorously.
