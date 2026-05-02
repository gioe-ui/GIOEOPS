import { getDb } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  try {
    console.log('Getting database connection...');
    const db = await getDb();
    
    if (!db) {
      console.error('Failed to get database connection');
      process.exit(1);
    }
    
    console.log('✓ Connected to database');
    console.log('Executing migration...');
    
    // Drizzle MySQL2 supports execute method
    await db.execute(sql.raw(`
      ALTER TABLE evaluations 
      ADD COLUMN IF NOT EXISTS updatedBy TEXT AFTER parecer,
      ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER updatedBy
    `));
    
    console.log('✓ Migration executed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
