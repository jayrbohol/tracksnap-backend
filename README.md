# TrackSnap Backend

Express-based backend for parcel tracking, scan verification, and notification workflow.

## Features
- Create parcel with recipient info and metadata (generates QR code)
- Verify scan / handoff event (logs courier + GPS + timestamp + optional photo)
- Fetch parcel details including handoff log and feedback
- Submit recipient feedback & flag issues (alerts ops team)
- Pluggable data layer (in-memory default; Firestore or Supabase later)
- Notification services: Twilio SMS, SendGrid email (safe no-op when not configured)

## Tech Stack
- Node.js 18+
- Express.js
- Optional: Firebase Firestore (via firebase-admin) or Supabase (PostgreSQL)
- Twilio (SMS), SendGrid (Email)

## Folder Structure
```
src/
  app.js
  server.js
  routes/
  controllers/
  services/
  services/repositories/
  models/
  utils/
```

## API Endpoints
| Method | Path          | Description |
|--------|---------------|-------------|
| POST   | /parcel       | Create parcel (returns parcel incl. QR) |
| GET    | /parcel/:id   | Get parcel details |
| POST   | /verify-scan  | Log handoff (courier -> recipient) & notify |
| POST   | /feedback     | Submit rating / issue flag |
| POST   | /track-parcel | Append real-time location update |
| GET    | /parcel/:id/tracking | Get tracking history only |

## Real-time WebSocket
- URL: `ws://localhost:4000/ws`
- Messages emitted:
  - `{"type":"handoff","parcelId":"...","status":"delivered","lastLog":{...}}`
  - `{"type":"tracking","parcelId":"...","point":{timestamp,coordinates}}`

Use any WS client (e.g., browser DevTools):
```js
const ws = new WebSocket('ws://localhost:4000/ws');
ws.onmessage = e => console.log('WS', JSON.parse(e.data));
```
| GET    | /health       | Health check |

### Request Shapes
Create Parcel (POST /parcel):
```json
{
  "recipient": { "name": "Jane", "phone": "+15556667777", "email": "jane@example.com" },
  "metadata": { "orderId": "ABC123" }
}
```

Verify Scan (POST /verify-scan):
```json
{
  "parcelId": "uuid",
  "courierId": "courier-42",
  "gps": { "lat": 40.7128, "lng": -74.0060 },
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

Feedback (POST /feedback):
```json
{
  "parcelId": "uuid",
  "rating": 5,
  "issue": "Box damaged"
}
```

## Environment Variables
See `.env.example` for full list. Copy to `.env` and fill values.

Important:
- Set `DISABLE_EXTERNAL=true` during local dev to avoid hitting Twilio/SendGrid.
- Provide at least one of Twilio or SendGrid credentials to test notifications.
- Select data backend with `DATA_BACKEND` (memory | firestore | supabase). Memory requires no setup.

## Running Locally
Install dependencies:
```bash
npm install
```

Start dev server (auto-reload):
```bash
npm run dev
```

Test with curl (example):
```bash
curl -X POST http://localhost:3000/parcel \
  -H "Content-Type: application/json" \
  -d '{"recipient":{"name":"Jane"},"metadata":{"orderId":"ABC123"}}'
```

## Data Layer Adapters (Planned)
- In-memory (default, no persistence)
- Firestore (set FIREBASE_* vars + DATA_BACKEND=firestore)
- Supabase (create table `parcels` and set SUPABASE_* vars + DATA_BACKEND=supabase)

To add: implement same interface as `memoryParcelRepo` with `save(parcel)` and `getById(id)`.

## Deployment
Options: Railway (buildpack), Vercel serverless (adjust export), Docker on VPS.

Example Dockerfile (to add later):
```
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3000
CMD ["node","src/server.js"]
```

## License
MIT (add if desired)
