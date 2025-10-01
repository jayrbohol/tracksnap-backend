import app from './app.js';
import { initWebSocket } from './utils/wsHub.js';

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`TrackSnap backend listening on port ${port}`);
});

initWebSocket(server);
