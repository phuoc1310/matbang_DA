import db from './config/db.js';

async function main() {
  try {
    // 1. Thêm cột role nếu chưa có
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
    `);
    console.log("✅ Đã thêm cột 'role' vào bảng users");

    // 2. Tạo tài khoản admin trên Firebase Auth
    const signUpRes = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAdQs6A3-4LZUUnz-A727PZLPwNDQOE3ZE',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@renthub.vn',
          password: '123456@',
          returnSecureToken: true
        })
      }
    );
    const signUpData = await signUpRes.json();

    if (signUpData.error) {
      if (signUpData.error.message === 'EMAIL_EXISTS') {
        console.log("⚠️ Email admin@renthub.vn đã tồn tại trên Firebase Auth. Đang đăng nhập...");
        // Đăng nhập để lấy UID
        const loginRes = await fetch(
          'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAdQs6A3-4LZUUnz-A727PZLPwNDQOE3ZE',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'admin@renthub.vn',
              password: '123456@',
              returnSecureToken: true
            })
          }
        );
        const loginData = await loginRes.json();
        if (loginData.error) {
          console.error("❌ Lỗi đăng nhập:", loginData.error.message);
          process.exit(1);
        }
        signUpData.localId = loginData.localId;
        signUpData.email = loginData.email;
      } else {
        console.error("❌ Lỗi tạo tài khoản Firebase:", signUpData.error.message);
        process.exit(1);
      }
    }

    const firebaseUid = signUpData.localId;
    const email = signUpData.email || 'admin@renthub.vn';
    console.log(`✅ Firebase UID: ${firebaseUid}`);

    // 3. Upsert vào PostgreSQL với role = 'admin'
    const check = await db.query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
    
    if (check.rows.length > 0) {
      await db.query(
        'UPDATE users SET role = $1, name = $2 WHERE firebase_uid = $3',
        ['admin', 'Admin RentHub', firebaseUid]
      );
      console.log("✅ Đã cập nhật user hiện tại thành admin");
    } else {
      await db.query(
        'INSERT INTO users (firebase_uid, email, name, role) VALUES ($1, $2, $3, $4)',
        [firebaseUid, email, 'Admin RentHub', 'admin']
      );
      console.log("✅ Đã tạo tài khoản admin mới trong PostgreSQL");
    }

    // 4. Kiểm tra lại
    const result = await db.query('SELECT * FROM users WHERE role = $1', ['admin']);
    console.log("\n=== Admin Users ===");
    console.log(JSON.stringify(result.rows, null, 2));

    console.log("\n🎉 THÀNH CÔNG! Tài khoản admin:");
    console.log("   Email: admin@renthub.vn");
    console.log("   Mật khẩu: 123456@");

  } catch (e) {
    console.error("❌ Lỗi:", e);
  }
  process.exit();
}
main();
