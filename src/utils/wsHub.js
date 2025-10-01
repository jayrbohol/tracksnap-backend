import { WebSocketServer } from 'ws';

let wss;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'welcome', ts: Date.now() }));
  });
  return wss;
}

function broadcast(obj) {
  if (!wss) return;
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

export const wsHub = {
  broadcastHandoff(parcel) {
    broadcast({ type: 'handoff', parcelId: parcel.id, status: parcel.status, lastLog: parcel.handoffLog.at(-1) });
  },
  broadcastTracking(parcelId, entry) {
    broadcast({ type: 'tracking', parcelId, point: entry });
  }
};
