// ============================================================
// server.js — Entry Point
// PURPOSE: Start the HTTP server and connect to the database.
// WHY: Separating server startup from app config enables testing.
// HOW: Connect DB first → then start listening.
// ============================================================

require('dotenv').config(); // MUST be first — loads env before anything else

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

/**
 * startServer — async IIFE (Immediately Invoked Function Expression)
 *
 * WHY async IIFE?
 * top-level await is only available in ES modules, not CommonJS.
 * We wrap everything in an async function and immediately call it.
 *
 * Startup sequence matters:
 * 1. Connect to MongoDB FIRST
 * 2. Only start listening AFTER DB is ready
 * WHY? If we start the server before DB connects, incoming requests
 * would crash when they try to query the database.
 */
(async () => {
  try {
    // Step 1: Connect to database
    await connectDB();

    // Step 2: Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════╗');
      console.log('║    🔗 URL Shortener Service Started       ║');
      console.log('╠══════════════════════════════════════════╣');
      console.log(`║  🌍 Server: http://localhost:${PORT}         ║`);
      console.log(`║  📊 Dashboard: http://localhost:${PORT}/dashboard ║`);
      console.log(`║  🔑 Demo Key: ${process.env.DEMO_API_KEY || 'demo_key_12345'} ║`);
      console.log('╚══════════════════════════════════════════╝');
      console.log('');
    });

    // ── Graceful Shutdown ────────────────────────────────────────────────────
    /**
     * SIGTERM: sent by OS/Docker/Kubernetes when stopping the process
     * SIGINT: sent when you press Ctrl+C in terminal
     *
     * Graceful shutdown:
     * 1. Stop accepting new connections
     * 2. Wait for in-flight requests to complete
     * 3. Close DB connection
     * 4. Exit
     *
     * WHY? Abruptly killing the process can:
     *  - Leave DB transactions incomplete
     *  - Drop in-progress requests
     *  - Corrupt analytics data
     */
    const shutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}. Gracefully shutting down...`);

      server.close(async () => {
        console.log('🔌 HTTP server closed');

        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('🗄️  MongoDB connection closed');

        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ── Unhandled Rejection Handler ─────────────────────────────────────────
    // Catches unhandled Promise rejections (async errors without try/catch)
    process.on('unhandledRejection', (reason, promise) => {
      console.error('⚠️  Unhandled Promise Rejection:', reason);
      // In production: log to monitoring service (Sentry, Datadog)
      // Then gracefully shut down
      shutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
