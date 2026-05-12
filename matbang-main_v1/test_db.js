import db from './config/db.js';
async function run() {
  try {
    const res = await db.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1', ['users']);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
