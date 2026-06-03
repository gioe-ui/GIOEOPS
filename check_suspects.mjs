import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gioe_gnr',
});

try {
  const [rows] = await connection.execute(
    'SELECT * FROM suspects WHERE evaluationId = ?',
    [840001]
  );
  console.log('Suspects found:', rows.length);
  console.log(JSON.stringify(rows, null, 2));
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await connection.end();
}
