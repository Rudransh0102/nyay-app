const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });

async function applySchema() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const schemaPath = process.env.SCHEMA_PATH
    ? path.resolve(projectRoot, process.env.SCHEMA_PATH)
    : path.join(projectRoot, 'nyay_final_schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await client.connect();
    console.log('Applying legal explorer schema...');
    await client.query(sql);
    console.log('✅ Schema applied successfully!');
  } catch (err) {
    console.error('❌ Failed to apply schema:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
