const { Client } = require('pg');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });

async function listTables() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env');
    process.exit(1);
  }

  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres');
    
    // List schemas
    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog')");
    console.log('\nSchemas:', schemas.rows.map(r => r.schema_name).join(', '));

    // List tables in public
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('\nTables in public:', tables.rows.map(r => r.table_name).join(', '));

  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.end();
  }
}
listTables();
