const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: true } // use proper SSL in production
    : false // no SSL in development to avoid warnings
});

module.exports = pool;