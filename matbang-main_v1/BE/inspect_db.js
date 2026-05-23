import db from './config/db.js';

async function inspectDb() {
  try {
    const tableRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('--- TABLES ---');
    for (let row of tableRes.rows) {
      const tableName = row.table_name;
      console.log('\\nTable:', tableName);
      
      const colRes = await db.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      for (let col of colRes.rows) {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      }
      
      const fkRes = await db.query(`
        SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
      `, [tableName]);
      
      if (fkRes.rows.length > 0) {
        console.log('  Foreign Keys:');
        for (let fk of fkRes.rows) {
          console.log(`    -> ${fk.column_name} references ${fk.foreign_table_name}(${fk.foreign_column_name})`);
        }
      }
    }
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

inspectDb();
