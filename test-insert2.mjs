import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { mysqlTable, int, varchar, text, timestamp } from 'drizzle-orm/mysql-core';

const connection = await mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'gioe_db',
});

const db = drizzle(connection);

const evaluations = mysqlTable('evaluations', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  nuipc: varchar('nuipc', { length: 50 }),
  neop: varchar('neop', { length: 20 }).notNull(),
  pontuacao: int('pontuacao').notNull().default(0),
});

// Test insert
const result = await db.insert(evaluations).values({
  userId: 1,
  nuipc: 'TEST-INSERT-2',
  neop: '1º NEOP',
  pontuacao: 10,
});

console.log('Result keys:', Object.keys(result));
console.log('Result:', result);
console.log('insertId:', (result).insertId);

await connection.end();
