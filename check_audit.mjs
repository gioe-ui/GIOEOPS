import { getDb } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function checkAudit() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Failed to get database connection');
      process.exit(1);
    }

    console.log('Checking audit fields for evaluation ID 180001...');
    
    // Query using raw SQL
    const result = await db.execute(sql.raw(`
      SELECT id, parecer, updatedBy, updatedAt, createdAt 
      FROM evaluations 
      WHERE id = 180001
    `));

    console.log('\n✓ Query result:');
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

checkAudit();
