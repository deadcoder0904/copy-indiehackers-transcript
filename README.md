# Copy Indie Hackers Transcript

A Chrome/Firefox extension that grabs Indie Hackers podcast transcripts and turns them into clean, copyable markdown (with a plain-text download option).

## Features

- Extracts full transcripts from Indie Hackers podcast episode pages.
- Formats the text into readable markdown for notes or archives.
- One-click actions to copy markdown or download `transcript.txt`.
- Build targets for Chrome and Firefox.

## Example episode

Try it on:
`https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values`

## How to use

1. Open an Indie Hackers podcast episode in Chrome or Firefox.
2. Click the extension icon.
3. Choose **Copy Markdown** or **Save transcript.txt**.

## Installation (local build)

1. Build the extension for your target browser (see below).
2. Load the `dist/` folder as an unpacked extension.

## Development

Requirements:

- Bun (latest recommended)
- `zip` CLI for the `zip` scripts (optional)

Install dependencies:
`bun install`

Run a dev build:

- Chrome: `bun run dev`
- Firefox: `bun run dev:firefox`

Production builds:

- Chrome: `bun run build:chrome`
- Firefox: `bun run build:firefox`
- Both: `bun run build:all`

## Scripts

- `build:dev` — run a development build
- `build:prod` — production build
- `build:chrome` / `build:firefox` — browser-specific production builds
- `build:all` — build both targets
- `dev` / `dev:firefox` — watch mode for Chrome or Firefox
- `icons` / `icons:check` — generate or verify icon sizes
- `zip` / `zip:chrome` / `zip:firefox` / `zip:all` — archive the built extension
- `test` — run Bun tests
- `lint` / `format` — Biome checks and formatting

## Project layout

- `src/background/service-worker.ts` — background logic
- `src/popup/` — popup UI and script
- `src/shared/` — shared utilities and types
- `src/styles/` — Tailwind CSS entry point
- `manifests/` — per-browser manifest templates
- `scripts/` — build, icon, and zip tooling

## Notes

- If you update the icon, run `bun run icons` to regenerate sizes.
- Transcripts only appear on Indie Hackers podcast episode pages.
