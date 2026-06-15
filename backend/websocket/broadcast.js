/**
 * WebSocket broadcast server for real-time MQTT data
 * Broadcasts MQTT messages to all connected WebSocket clients
 */
const { WebSocketServer } = require('ws');

let wss = null;
const clients = new Set();

function createWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[WS] Client connecté: ${clientIp} (total: ${clients.size + 1})`);
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Connecté au flux temps réel LUMEN',
      timestamp: new Date().toISOString(),
    }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client déconnecté (total: ${clients.size})`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Erreur client:', err.message);
      clients.delete(ws);
    });

    // Handle subscription requests from client
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe' && msg.siteId) {
          ws.siteFilter = msg.siteId;
          ws.send(JSON.stringify({
            type: 'system',
            message: `Abonné aux données du site: ${msg.siteId}`,
          }));
        }
        if (msg.type === 'unsubscribe') {
          ws.siteFilter = null;
        }
      } catch {
        // Ignore malformed messages
      }
    });
  });

  console.log('[WS] Serveur WebSocket prêt sur /ws');
  return wss;
}

/**
 * Broadcast a message to all connected WebSocket clients
 * Optionally filtered by site_id if clients subscribed to specific sites
 */
function broadcast(data) {
  if (!wss || clients.size === 0) return;

  const payload = JSON.stringify(data);
  const deadClients = new Set();

  for (const client of clients) {
    if (client.readyState !== 1) { // WebSocket.OPEN = 1
      deadClients.add(client);
      continue;
    }

    // Filter by site if client subscribed to a specific site
    if (client.siteFilter && data.site_id && client.siteFilter !== data.site_id) {
      continue;
    }

    client.send(payload, (err) => {
      if (err) {
        deadClients.add(client);
      }
    });
  }

  // Clean up dead clients
  for (const dead of deadClients) {
    clients.delete(dead);
    try { dead.terminate(); } catch { /* ignore */ }
  }
}

/**
 * Get number of connected WebSocket clients
 */
function getClientCount() {
  let count = 0;
  for (const client of clients) {
    if (client.readyState === 1) count++;
  }
  return count;
}

module.exports = { createWebSocketServer, broadcast, getClientCount };
