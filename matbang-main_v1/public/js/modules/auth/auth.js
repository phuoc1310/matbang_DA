import { auth } from "../../config/firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================== INTERNAL CACHE ================== */
// giữ API cũ nhưng cache bằng sessionStorage
function setCurrentUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}

/* ================== VALIDATION (GIỮ NGUYÊN) ================== */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[0-9]{10,11}$/.test(phone.replace(/\s/g, ""));
}

function validatePassword(password) {
  return password.length >= 6;
}

/* ================== REGISTER ================== */
/* GIỮ TÊN HÀM */
async function register(userData) {
  
  try {
    // validate
    if (!validateEmail(userData.email)) {
      return { success: false, message: "Email không hợp lệ." };
    }

    if (!validatePassword(userData.password)) {
      return { success: false, message: "Mật khẩu phải ≥ 6 ký tự." };
    }

    if (userData.phone && !validatePhone(userData.phone)) {
      return { success: false, message: "Số điện thoại không hợp lệ." };
    }

    const role = userData.role || "nguoithue";
    if (!["user", "user"].includes(role)) {
      return { success: false, message: "Vai trò không hợp lệ." };
    }

    // Firebase Auth
    const cred = await createUserWithEmailAndPassword(
      auth,
      userData.email.trim().toLowerCase(),
      userData.password
    );

    const uid = cred.user.uid;
    const token = await cred.user.getIdToken(); // 🔥 Lấy token JWT

    // Xóa logic lưu vào Firestore vì chỉ dùng PostgreSQL


    // 🔥 SYNC WITH POSTGRESQL BACKEND
    let postgresUser = null;
    try {
      const syncRes = await fetch("/api/users/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: userData.fullName,
          phone: userData.phone
        })
      });
      if (syncRes.ok) {
        postgresUser = await syncRes.json();
      } else {
        console.warn("Backend sync failed", await syncRes.text());
      }
    } catch (e) {
      console.warn("Could not reach backend sync", e);
    }

    // Merge PostgreSQL ID (nếu có)
    const finalUser = { id: postgresUser?.id || uid, postgres_id: postgresUser?.id, email: userData.email.trim().toLowerCase(), role: "user", ...postgresUser };
    setCurrentUser(finalUser);

    return {
      success: true,
      message: "Đăng ký thành công!",
      user: finalUser
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
}

/* ================== LOGIN ================== */
/* GIỮ TÊN HÀM */
async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

    const uid = cred.user.uid;
    const token = await cred.user.getIdToken(); // 🔥 Lấy token JWT

    let user = { id: uid, email: email, role: "user" }; // Mock mặc định
    // Đã xóa Firestore getDoc


    // 🔥 SYNC WITH POSTGRESQL BACKEND
    try {
      const syncRes = await fetch("/api/users/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({}) // Login update token
      });
      if (syncRes.ok) {
        const postgresUser = await syncRes.json();
        // Override id với PostgreSQL id để map với search_history/compare
        user = { ...user, postgres_id: postgresUser.id, id: postgresUser.id || uid };
      } else {
        console.warn("Backend sync failed", await syncRes.text());
      }
    } catch (e) {
      console.warn("Could not reach backend sync", e);
    }

    setCurrentUser(user);

    return { success: true, message: "Đăng nhập thành công!", user };
  } catch (err) {
    return { success: false, message: "Email hoặc mật khẩu không đúng." };
  }
}

/* ================== LOGOUT ================== */
async function logout() {
  await signOut(auth);
  sessionStorage.removeItem("currentUser");
  return { success: true, message: "Đăng xuất thành công!" };
}

/* ================== GET CURRENT USER ================== */
function getCurrentUser() {
  const raw = sessionStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

/* ================== CHECK ================== */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === "admin";
}

/* ================== UPDATE CURRENT USER ================== */
async function updateCurrentUser(updatedData) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Bạn chưa đăng nhập." };
  }

  // Chú ý: Bạn đã bỏ Firestore, để cập nhật user bạn cần gọi API Backend (PostgreSQL) ở đây
  // Tạm thời chỉ cập nhật localStorage
  const updatedUser = { ...currentUser, ...updatedData };
  setCurrentUser(updatedUser);

  return { success: true, message: "Cập nhật thành công (Local)!", user: updatedUser };
}

/* ================== CHANGE PASSWORD ================== */
/* Firebase Auth xử lý mật khẩu */
async function changePassword(oldPassword, newPassword) {
  if (!validatePassword(newPassword)) {
    return { success: false, message: "Mật khẩu mới ≥ 6 ký tự." };
  }

  return {
    success: false,
    message: "Đổi mật khẩu dùng Firebase Auth (reauth required)."
  };
}

/* ================== SET USER AS ADMIN ================== */
async function setUserAsAdmin(userId) {
  return { success: false, message: "Tính năng này yêu cầu Backend PostgreSQL." };
}

/* ================== REMOVE ADMIN ROLE ================== */
async function removeAdminRole(userId) {
  return { success: false, message: "Tính năng này yêu cầu Backend PostgreSQL." };
}

export { register, login, logout, getCurrentUser, isLoggedIn, isAdmin, updateCurrentUser, changePassword, setUserAsAdmin, removeAdminRole };
/* ================== EXPORT GLOBAL (KHỚP FILE CŨ) ================== */
window.register = register;
window.login = login;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.isAdmin = isAdmin;
window.updateCurrentUser = updateCurrentUser;
window.changePassword = changePassword;
window.setUserAsAdmin = setUserAsAdmin;
window.removeAdminRole = removeAdminRole;
