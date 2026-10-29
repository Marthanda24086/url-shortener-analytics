// ============================================================
// src/config/db.js
// PURPOSE: Establishes and manages the MongoDB connection.
// WHY: Centralizing DB config means one place to change it.
// HOW: Uses Mongoose's connect() which returns a Promise.
// ============================================================

const mongoose = require('mongoose');

/**
 * connectDB — async function that connects Mongoose to MongoDB.
 * Called ONCE at server startup (in server.js).
 * Mongoose maintains an internal connection pool — you never call this again.
 */
const connectDB = async () => {
  try {
    // mongoose.connect() accepts the URI from .env
    // useNewUrlParser & useUnifiedTopology are no longer needed in Mongoose 7+
    // but we pass options for clarity
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ handles these automatically, but listed for learning
      serverSelectionTimeoutMS: 5000, // fail fast if DB is unreachable
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure — app cannot run without DB
    process.exit(1);
  }
};

module.exports = connectDB;
