const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  try {
    console.log('Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✓ Connected to database');
    console.log('Executing migration...');
    
    const migrationSQL = `
      ALTER TABLE evaluations 
      ADD COLUMN IF NOT EXISTS updatedBy TEXT AFTER parecer,
      ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER updatedBy;
    `;

    const [result] = await connection.execute(migrationSQL);
    console.log('✓ Migration executed successfully');
    
    // Verify columns were added
    const [columns] = await connection.execute('DESCRIBE evaluations');
    const hasUpdatedBy = columns.some(col => col.Field === 'updatedBy');
    const hasUpdatedAt = columns.some(col => col.Field === 'updatedAt');
    
    console.log('✓ Verification:');
    console.log(`  - updatedBy column: ${hasUpdatedBy ? '✓ Present' : '✗ Missing'}`);
    console.log(`  - updatedAt column: ${hasUpdatedAt ? '✓ Present' : '✗ Missing'}`);
    
    await connection.end();
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    if (connection) await connection.end();
    throw error;
  }
}

runMigration();
