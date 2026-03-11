//conexion con postgre

const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
console.log("🔥 usando db.js de backend");
module.exports = pool;