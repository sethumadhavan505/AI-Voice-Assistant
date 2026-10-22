# Aura AI — Voice Assistant

A full-stack voice assistant starter built with React, Vite, Express, and the OpenAI API.

## Features
- Text chat with AI responses
- Browser speech recognition (supported browsers only)
- Browser text-to-speech replies
- Animated voice orb and listening indicator
- Conversation history for the current browser session
- Server-side API key handling

## Requirements
- Node.js 20+
- An OpenAI API key

## Run locally

### 1. Configure the backend
```bash
cd server
npm install
```
Copy `.env.example` to `.env` and add your API key:
```env
OPENAI_API_KEY=your_real_key_here
PORT=3001
```
Never commit `.env` or put the API key in `client/`.

### 2. Run the backend
```bash
npm run dev
```
The API runs at `http://localhost:3001`.

### 3. Run the frontend (new terminal)
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite, usually `http://localhost:5173`.

## Voice support
Use a recent version of Chrome or Edge and allow microphone access. Browser speech recognition is not supported in every browser. Text chat still works if voice recognition is unavailable.

## Deploy
This starter is configured for local development. For production, deploy the frontend and backend to a host that supports both, or deploy the Express API separately and set `VITE_API_URL` in the frontend environment to the API base URL. Configure `OPENAI_API_KEY` only in the backend host's environment variables. Configure CORS to allow only your deployed frontend origin.

## Security notes
- `.env` is ignored by Git.
- The frontend never receives the OpenAI API key.
- Add authentication, rate limiting, request-size limits, and usage monitoring before making a public production deployment.
