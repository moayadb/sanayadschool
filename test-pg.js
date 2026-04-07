const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sanayadschool',
  user: 'postgres',
  password: '123456',
});

async function test() {
  try {
    await client.connect();
    console.log("✅ Connected with pg driver!");
    const result = await client.query('SELECT 1 as test');
    console.log("Query result:", result.rows);
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
}

test();
