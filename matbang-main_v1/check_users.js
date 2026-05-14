import db from './config/db.js';

async function main() {
  try {
    // Check table structure
    const cols = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    console.log("=== Users Table Columns ===");
    console.log(JSON.stringify(cols.rows, null, 2));

    // Check existing users
    const users = await db.query("SELECT * FROM users");
    console.log("\n=== Existing Users ===");
    console.log(JSON.stringify(users.rows, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
main();
