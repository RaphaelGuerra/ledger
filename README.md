# Cash Ledger

Last updated: 2025-12-19

## Table of Contents

<!-- TOC start -->
- [What It Does](#what-it-does)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Run Locally](#run-locally)
- [Status & Roadmap](#status--roadmap)
- [What I Practiced](#what-i-practiced)
- [License](#license)
<!-- TOC end -->

[![Lint](https://github.com/RaphaelGuerra/ledger/actions/workflows/lint.yml/badge.svg)](https://github.com/RaphaelGuerra/ledger/actions/workflows/lint.yml)
[![Security](https://github.com/RaphaelGuerra/ledger/actions/workflows/security.yml/badge.svg)](https://github.com/RaphaelGuerra/ledger/actions/workflows/security.yml)


Simple cash and daily entries tracker designed for small hospitality businesses.

This is a small side project for learning and practice — exploring local‑first data, print‑friendly UIs, and a lightweight encrypted sync flow in the browser. It is not a production system.

Branding shown in the UI is placeholder for demo purposes only.

Live demo: none (local-only)

## What It Does
- Monthly overview with previous/next navigation
- Daily entries grouped by category (Kitchen, Bar, Others) with totals and averages
- Ledger for adjustments and notes
- Print‑ready monthly report (single click)
- Local‑first persistence (per month) with optional encrypted sync via a passphrase ("Sync ID")
- Offline‑friendly (runs fully in the browser)

## How It Works
- Data is stored in `localStorage` under a month key (e.g., `YYYY-MM`).
- Optional encrypted sync uses the browser’s Web Crypto API; the Sync ID acts as the passphrase to encrypt/decrypt a JSON envelope.
- When a compatible `/api/storage/:syncId/:month` endpoint exists, the app PUTs/GETs the encrypted payload.
- Built with React and Vite; no backend required for local use.

## Tech Stack
- React 19 + Vite
- Vanilla CSS
- Vitest for unit tests
- ESLint + Prettier

## Run Locally
Prerequisites: Node.js >= 20

```bash
npm install
npm run dev
```

Open the local server shown by Vite (usually http://localhost:5173).

## Status & Roadmap
- Current: functional prototype used for learning
- Next ideas: improved mobile layout, CSV import/export, customizable categories, and multi‑user sync flows

## What I Practiced
- Local‑first state and debounced persistence
- Print‑specific layout and browser print events
- Encrypting/decrypting JSON with Web Crypto

## License
All rights reserved. Personal portfolio project — not for production use.
