import db from './config/db.js';

async function createAdmin(email, password, name) {
  try {
    console.log(`\n--- Đang tạo admin: ${email} ---`);
    // 1. Tạo tài khoản admin trên Firebase Auth
    const signUpRes = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAdQs6A3-4LZUUnz-A727PZLPwNDQOE3ZE',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      }
    );
    const signUpData = await signUpRes.json();

    if (signUpData.error) {
      if (signUpData.error.message === 'EMAIL_EXISTS') {
        console.log(`⚠️ Email ${email} đã tồn tại trên Firebase Auth. Đang đăng nhập...`);
        // Đăng nhập để lấy UID
        const loginRes = await fetch(
          'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAdQs6A3-4LZUUnz-A727PZLPwNDQOE3ZE',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              password: password,
              returnSecureToken: true
            })
          }
        );
        const loginData = await loginRes.json();
        if (loginData.error) {
          console.error(`❌ Lỗi đăng nhập ${email}:`, loginData.error.message);
          return;
        }
        signUpData.localId = loginData.localId;
        signUpData.email = loginData.email;
      } else {
        console.error(`❌ Lỗi tạo tài khoản Firebase ${email}:`, signUpData.error.message);
        return;
      }
    }

    const firebaseUid = signUpData.localId;
    console.log(`✅ Firebase UID: ${firebaseUid}`);

    // 2. Upsert vào PostgreSQL với role = 'admin'
    const check = await db.query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
    
    if (check.rows.length > 0) {
      await db.query(
        'UPDATE users SET role = $1, name = $2 WHERE firebase_uid = $3',
        ['admin', name, firebaseUid]
      );
      console.log(`✅ Đã cập nhật user ${email} thành admin`);
    } else {
      await db.query(
        'INSERT INTO users (firebase_uid, email, name, role) VALUES ($1, $2, $3, $4)',
        [firebaseUid, email, name, 'admin']
      );
      console.log(`✅ Đã tạo tài khoản admin mới ${email} trong PostgreSQL`);
    }
  } catch (e) {
    console.error(`❌ Lỗi khi xử lý ${email}:`, e);
  }
}

async function main() {
  try {
    // Đảm bảo cột role tồn tại
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`);
    
    await createAdmin('admin2@renthub.vn', '123456@', 'Admin 2 RentHub');
    await createAdmin('admin3@renthub.vn', '123456@', 'Admin 3 RentHub');
    
    // In kết quả
    const result = await db.query("SELECT email, name, role FROM users WHERE role = 'admin'");
    console.log("\n=== Danh Sách Admin ===");
    console.table(result.rows);

  } catch (e) {
    console.error("❌ Lỗi chính:", e);
  }
  process.exit();
}
main();
