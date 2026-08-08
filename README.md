# EV Tools ⚡

> Open-source collection of online tools and utilities for Electric Vehicle (EV) owners, inspired by platforms like [it-tools.tech](https://it-tools.tech).

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)](https://ui.shadcn.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Overview

**EV Tools** provides clean, fast, privacy-focused calculators and conversion utilities tailored for EV drivers, Tesla owners, BMW i4 drivers, Hyundai Ioniq users, and all electric vehicle enthusiasts.

Whether you're deciding if driving out of your way to a cheaper DC fast charger actually saves money or converting efficiency metrics across international units (`kWh/100km`, `mi/kWh`, `Wh/km`, `MPGe`), EV Tools simplifies EV math.

---

## 🚀 Features

### 🛠️ Active Tools & Utilities
- **⚡ Detour Charger Savings Calculator**:
  - Compare a primary charger against a cheaper detour charger.
  - Computes additional energy consumed by detour driving.
  - Dynamically calculates **break-even charging session (kWh)** and **net savings ($/€/£)**.
  - Dual-thumb range slider for target battery charge range (% SOC to % SOC).
  - Synchronized via URL query parameters (`nuqs`) for instant sharing & bookmarking.

- **🚗 Vehicle Garage & Profile Management**:
  - Save custom EV profiles or choose from pre-configured presets (*Tesla Model Y/3, BMW i4, Hyundai Ioniq 5, Porsche Taycan, EV6, Mustang Mach-E*).
  - Set custom usable battery size (kWh) and rated efficiency.
  - Global currency formatting (*USD, EUR, GBP, CAD, AUD, CHF, NOK, SEK*) & distance unit toggle (*km vs. miles*).

### 🔮 Planned Tools (In Roadmap)
- **🔌 Charging Time & Curve Estimator**: Estimate charging duration from X% to Y% based on charger peak kW, battery capacity, and non-linear charging curves.
- **🗺️ EV Trip Cost Calculator**: Calculate total cost and energy needed for long road trips based on distance, driving speed, and charging stops.
- **📐 EV Consumption Unit Converter**: Instant conversion between `kWh/100km`, `mi/kWh`, `Wh/km`, `km/kWh`, `Wh/mi`, and `MPGe`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Static Export)
- **UI & Components**: [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Typography**: [Lucide Icons](https://lucide.dev/), Google Fonts (*Outfit, Inter, Geist Mono*)
- **State Management & URL Sync**: [nuqs](https://nuqs.47ng.com/) (Type-safe search params) + `localStorage` fallback
- **SEO & Web Standards**: OpenGraph meta tags, Twitter Cards, JSON-LD structured data (`WebApplication`), Web App Manifest, auto-generated `sitemap.xml` & `robots.txt`

---

## 🖥️ Local Development

### Prerequisites
- **Node.js** >= 20.x
- **pnpm** >= 8.x

### Quickstart

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Dan6erbond/ev-tools.git
   cd ev-tools
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build & Verify Static Export**:
   ```bash
   pnpm build
   ```
   *Note: `pnpm build` generates the static HTML export in the `out/` directory and performs full TypeScript type checking and linting.*

---

## 🚀 Deployment

EV Tools is configured for static export (`output: 'export'`) and hosted via GitHub Pages.

Every commit pushed to `main` triggers a GitHub Action workflow located in `.github/workflows/deploy.yml` that builds and deploys the static bundle.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add a new tool or utility:

1. Register your tool definition in [`lib/tools/registry.ts`](file:///c:/Users/morav/Documents/Projects/ev-tools/lib/tools/registry.ts).
2. Create the tool component in [`components/tools/`](file:///c:/Users/morav/Documents/Projects/ev-tools/components/tools/).
3. Add the route or render logic in [`app/tools/[slug]/page.tsx`](file:///c:/Users/morav/Documents/Projects/ev-tools/app/tools/%5Bslug%5D/page.tsx).
4. Run `pnpm build` to verify there are no type or build errors.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
