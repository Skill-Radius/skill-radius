# SkillRadius

Online learning platform: courses, certifications and live trainings.

| Folder | What it is | Runs on |
|---|---|---|
| `frontend/` | The website. Plain HTML, CSS and JavaScript, no build step. | Render static site, https://skillradius.in |
| `server/` | The API. Node.js, Express and MongoDB. | Render web service, https://api.skillradius.in |

## Run it locally

```bash
# website
cd frontend && python3 -m http.server 8080      # http://localhost:8080

# API
cd server && npm install
cp .env.example .env                            # fill in MONGODB_URI
npm run dev                                     # http://localhost:4000/health
npm test
```

## Deploying

Pushing to `main` deploys both parts on Render.

| Service | Root | Build | Start / publish |
|---|---|---|---|
| Website (static site) | repo root | none | publish directory `frontend` |
| API (web service) | repo root | `cd server && npm ci` | `cd server && npm start` |

Secrets (database address, keys) are set in Render's Environment tab. They never go in this repo.

## Status

The website still keeps accounts, orders and progress in the visitor's browser and simulates payments.
The API is being built in steps (accounts, catalogue, payments, learning data); each step moves one
feature from the browser to the server.
