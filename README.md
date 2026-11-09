# Midnight Muse

A blog platform built with Next.js 15 (App Router), TypeScript, Tailwind CSS,
and Firebase, with Google Genkit AI integration.

## Features

Per `docs/blueprint.md`: blog post cards, dark/light theme toggle, animated
header, search, infinite scroll, category filters, post metadata, social
share buttons, comments with replies, pagination, author pages, newsletter
signup, and an admin analytics dashboard. Routes include home, blogs,
authors, search, login/signup, profile, admin, about, and contact.

## Getting started

```bash
npm install
cp .env.example .env   # then add your own GOOGLE_GENAI_API_KEY
npm run dev            # http://localhost:9002
```

Other scripts: `npm run build`, `npm start`, `npm run lint`,
`npm run typecheck`, `npm run genkit:dev`.

## Environment variables

See `.env.example`. Never commit a real `.env` — it is git-ignored. Note: a
real Google GenAI API key was previously committed to this repo's git
history; deleting the file does not remove it from history, so rotate the key.

## Tech

- Next.js 15, React 18, TypeScript
- Tailwind CSS, Radix UI components
- Firebase (Auth/Firestore), bcrypt
- Genkit AI (`@genkit-ai/googleai`), Quill rich-text editor
