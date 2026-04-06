import { auth, firestore } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


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

    // Firestore schema (KHỚP admin.js)
    const newUser = {
      email: userData.email.trim().toLowerCase(),
      fullName: userData.fullName || "",
      phone: userData.phone || "",
      address: userData.address || "",
      role: "user", 
      avatar: "",
      verified: false,
      vipStatus: false,
      vipExpiry: null,
      savedListings: [],
      viewedListings: [],
      myListings: [],
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      createdAt: serverTimestamp()
    };

    await setDoc(doc(firestore, "users", uid), newUser);

    setCurrentUser({ id: uid, ...newUser });

    return {
      success: true,
      message: "Đăng ký thành công!",
      user: { id: uid, ...newUser }
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
    const snap = await getDoc(doc(firestore, "users", uid));

    if (!snap.exists()) {
      return { success: false, message: "Không tìm thấy user." };
    }

    const user = { id: uid, ...snap.data() };
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

  await updateDoc(doc(firestore, "users", currentUser.id), updatedData);

  const updatedUser = { ...currentUser, ...updatedData };
  setCurrentUser(updatedUser);

  return { success: true, message: "Cập nhật thành công!", user: updatedUser };
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
  if (!isAdmin()) {
    return { success: false, message: "Không có quyền." };
  }

  const currentUser = getCurrentUser();
  if (currentUser.id === userId) {
    return { success: false, message: "Không thể set chính mình." };
  }

  await updateDoc(doc(firestore, "users", userId), { role: "admin" });
  return { success: true, message: "Đã cấp quyền admin!" };
}

/* ================== REMOVE ADMIN ROLE ================== */
async function removeAdminRole(userId) {
  if (!isAdmin()) {
    return { success: false, message: "Không có quyền." };
  }

  const snap = await getDocs(
    collection(firestore, "users")
  );
  const adminCount = snap.docs.filter(d => d.data().role === "admin").length;

  if (adminCount <= 1) {
    return { success: false, message: "Cần ít nhất 1 admin." };
  }

  await updateDoc(doc(firestore, "users", userId), { role: "user" });
  return { success: true, message: "Đã gỡ quyền admin!" };
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
