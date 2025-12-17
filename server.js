const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // Allow parsing JSON bodies
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients
let clients = [];

// SSE Endpoint
app.get('/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };

  clients.push(newClient);
  console.log(`Client connected: ${clientId}. Total clients: ${clients.length}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'info', message: 'Connected to server', timestamp: Date.now() })}\n\n`);

  // Heartbeat (every 5 seconds to keep connection alive and show activity)
  // We attach it to the client object to clear it later if we wanted specific per-client timers,
  // but for a global heartbeat we could loop through clients.
  // Here, let's keep the per-client interval as in the original code, but cleaner.
  const intervalId = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', time: new Date().toLocaleTimeString() })}\n\n`);
  }, 5000);

  // Clean up when client disconnects
  req.on('close', () => {
    clearInterval(intervalId);
    clients = clients.filter(client => client.id !== clientId);
    console.log(`Client disconnected: ${clientId}. Total clients: ${clients.length}`);
    res.end();
  });
});

// Endpoint to manually trigger an event to all clients
app.post('/trigger', (req, res) => {
  const { message, type } = req.body;

  const eventData = JSON.stringify({
    type: type || 'manual',
    message: message || 'Server event triggered manually',
    timestamp: Date.now()
  });

  clients.forEach(client => {
    client.res.write(`data: ${eventData}\n\n`);
  });

  res.json({ success: true, clientsReached: clients.length });
});

// Simulates a heavy server-side operation
app.get('/heavy-work', (req, res) => {
    const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds delay
    setTimeout(() => {
        res.json({ message: 'Work completed', duration: delay });
    }, delay);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
