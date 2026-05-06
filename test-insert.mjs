import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'gioe_db',
});

const db = drizzle(connection);

// Test insert
const result = await db.execute(`INSERT INTO evaluations (userId, nuipc, neop, pontuacao) VALUES (1, 'TEST-INSERT', '1º NEOP', 10)`);
console.log('Result:', JSON.stringify(result, null, 2));
console.log('Result[0]:', JSON.stringify(result[0], null, 2));

await connection.end();
