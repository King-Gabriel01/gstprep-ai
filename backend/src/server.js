require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./realtime/socket');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[server] GSTPrep AI backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log('[server] Socket.io real-time exam monitoring is active.');
  });
}

start();

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled rejection:', err);
});