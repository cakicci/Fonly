# Fonly

Fonly is a modern fintech web application built for users with low or zero financial literacy. It explains investment funds, stocks, risk levels, and basic financial concepts in plain Turkish.

## Tech Stack

- Next.js 14
- TypeScript
- TailwindCSS
- App Router
- Lucide React icons

## Features

- Premium dark fintech UI with a midnight blue background
- Fonly logo and branding
- Beginner-friendly Turkish explanations
- Market overview sidebar
- Investment category cards
- Popular fund cards with simple risk explanations
- Stock cards focused on historical performance and gold comparison
- Financial guide cards that explain basic terms
- Risk and income planner for beginner users

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

On Windows PowerShell, use:

```powershell
npm.cmd run dev
```

Open the app:

```text
http://127.0.0.1:3000
```

## Validation

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## Project Structure

```text
app/          App Router pages and global styles
components/   Reusable UI components
data/         Mock fund and stock data
public/       Static assets, including the Fonly logo
styles/       Reserved theme styles
```

## Notes

The app currently uses mock data only. It does not connect to a backend or live market data provider yet.
