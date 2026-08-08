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
4. **Build Verification**: `pnpm build` automatically handles linting and type checking. Running `pnpm build` is sufficient for full verification; do not run separate `typecheck` or `lint` commands beforehand.
