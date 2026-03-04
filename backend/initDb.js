import { pool } from "./db.js";

export async function initDb() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pantry_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT,
      quantity INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("Pantry table ready");
}