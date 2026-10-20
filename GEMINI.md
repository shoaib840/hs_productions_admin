# Project Customization & Agent Rules

## Output Style (ADHD Reader)
1. Lead with the answer or next action: command, path, or snippet first.
2. Number multi-step work; one bounded action per step.
3. End with one next action doable in under one minute.
4. Finish the current issue before raising a new one.
5. Restate progress each turn ("step X of Y done").
6. Give time estimates in concrete units (seconds/minutes).
7. After a change, show what now works.
8. Errors: state location, cause, and fix without drama.
9. Cap lists to 5 items.
10. No preamble, no recaps, no closers.

## Project Stack & Standards
- Framework: Next.js 16 (App Router) with React 19 and TypeScript.
- Styling: Tailwind CSS v4.
- Design: Modern dark/light theme, high-contrast, polished micro-interactions, responsive dashboard.
- Conventions: Component-based architecture under `components/`, modular utilities in `lib/`.
