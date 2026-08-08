<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context & Overview

`ev-tools` is an open-source collection of online tools and utilities for Electric Vehicle (EV) owners, inspired by platforms like [it-tools.tech](https://it-tools.tech).

## Core Stack
- **Framework**: Next.js (App Router)
- **UI & Styling**: shadcn/ui, Tailwind CSS
- **Deployment Target**: Static export (`output: 'export'`) hosted on GitHub Pages.

## Constraints & Architectural Rules
1. **Static Export Compatibility**: All pages and utilities must support static export (`output: 'export'`). Avoid server-side-only runtime dependencies or dynamic server rendering.
2. **Internationalization (i18n)**: When implementing i18n (e.g. `next-intl`), ensure all routes use static params (`generateStaticParams`) compatible with GitHub Pages export.
3. **Dynamic Content / Future Features**: Future features like a blog or localized pages must explicitly define static paths for build-time generation.
4. **Build Verification**: `pnpm build` automatically handles linting and type checking. Only run `pnpm build` for verification when you actually modify application source code, components, or build/lint configuration files. Do not run build verification when editing non-build files (e.g. documentation, AGENTS.md, markdown files, or CI configs). Do not run separate `typecheck` or `lint` commands beforehand.

## Component Reusability & Architecture Guidelines
1. **Component Locations & Directory Structure**: Keep full calculator tool components under `@/components/tools/` (e.g. `detour-calculator.tsx`). Place reusable UI blocks and cards (such as EV charge target selectors, vehicle status banners, and station pricing forms) under `@/components/blocks/` or `@/components/ui/`.
2. **Clean Imports & No Unused Imports**: Always remove unused imports. Do NOT import default `React` from `"react"` (`import React from "react"` is unnecessary in React 19). Use named imports for React hooks and type-only imports for types (e.g., `import { useEffect } from "react"` or `import type { ReactNode } from "react"`). ESLint rule `@typescript-eslint/no-unused-vars` strictly enforces this.
3. **Flexible & Decoupled Component Design**: Keep component APIs clean by accepting state callbacks and utilizing React slots/render props for tool-specific tab content, action buttons, or custom badges.
4. **Audit Existing Components**: Before creating new UI blocks or cards within calculator pages, check `@/components/blocks/` and `@/components/tools/` for existing reusable implementations to avoid duplicating markup and styling logic.

## Agent Behavior & Decision-Making
1. **User Confirmation First**: Ask for user confirmation and present options before making non-trivial architectural, structural, or configuration changes (e.g., removing module flags, modifying project configuration files, or refactoring setups). Do not make assumptions or change approaches without aligned approval.
2. **Git Operations & Pushing**: Do not run `git push`, `git commit`, `git reset`, or modify git history without explicit permission from the user for that specific action.
3. **Implementation Plan Reviews**: When an implementation plan receives feedback or review comments, do not proceed with implementation unless explicitly instructed to do so. First, update and rework the plan based on the review comments, and wait for explicit approval (e.g., clicking "Proceed") before starting any implementation work.


