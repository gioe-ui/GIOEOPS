import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  console.log('Applying migration...');
  await connection.execute('ALTER TABLE `evaluations` ADD `observacoes` text');
  console.log('✓ Added observacoes column');
  
  await connection.execute('ALTER TABLE `evaluations` ADD `outrasObservacoes` text');
  console.log('✓ Added outrasObservacoes column');
  
  console.log('Migration completed successfully!');
} catch (error) {
  if (error.code === 'ER_DUP_FIELDNAME') {
    console.log('Columns already exist, skipping...');
  } else {
    console.error('Migration failed:', error.message);
  }
} finally {
  await connection.end();
}
