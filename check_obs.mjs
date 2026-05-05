import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const [rows] = await connection.execute(
  'SELECT id, observacoes, outrasObservacoes FROM evaluations WHERE id = 360002'
);
console.log('Data:', JSON.stringify(rows, null, 2));
await connection.end();
