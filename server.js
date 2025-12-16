const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client

  console.log('Client connected');

  // Send an event every second
  const intervalId = setInterval(() => {
    const data = JSON.stringify({ time: new Date().toLocaleTimeString() });
    res.write(`data: ${data}\n\n`);
  }, 1000);

  // Clean up when client disconnects
  req.on('close', () => {
    clearInterval(intervalId);
    console.log('Client disconnected');
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
