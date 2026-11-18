# Global AI Call Center Academy — v10.1

**Roles:** The AI is always the customer and speaks first. The human is the trainee agent. The customer listens and responds through the Realtime API over WebRTC.

## Requirements
- Node.js 20.6+ (Node 22 recommended).
- A fresh, valid OpenAI API key. Revoke any key previously exposed in chat.
- API billing and Realtime API access enabled.
- Chrome or Edge with microphone permission.

## Local setup
1. Extract the package.
2. Copy `.env.example` to `.env`.
3. Put the fresh key in `OPENAI_API_KEY` in `.env` only. Never place it in HTML, chat, or Git.
4. Install Node.js from https://nodejs.org/ if needed.
5. Run `npm install`, then `npm start`.
6. Open `http://localhost:3000`, allow microphone access, choose language/market/brand/campaign, and start the customer call.

## Deploy to Render
1. Push the project folder to a private GitHub repository. `.gitignore` excludes `.env`.
2. In Render choose New > Blueprint and connect the repository containing `render.yaml`.
3. Add `OPENAI_API_KEY` in Render Environment only. Never commit it.
4. Deploy, then open the HTTPS URL in Chrome and allow microphone access.

## Security and test status
- Any key exposed in a chat, screenshot, or repository must be revoked and replaced. This package cannot revoke keys in your account.
- A basic per-IP session rate limit is included. Add authentication, roles, shared rate limiting, audit logs, and spend controls before production use.
- No API key or billing credentials are included. Browser code never receives the standard API key.
- A real audio call is not considered tested until a valid key is configured on the server and a live HTTPS/device test succeeds.
