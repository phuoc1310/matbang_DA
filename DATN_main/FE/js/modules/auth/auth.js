import { auth } from "../../config/firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();



function setCurrentUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}


export async function getValidToken() {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        resolve(await user.getIdToken());
      } else {
        resolve(null);
      }
    });
    
    setTimeout(() => resolve(null), 3000);
  });
}


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

    const role = userData.role || "user";
    if (!["user", "admin"].includes(role)) {
      return { success: false, message: "Vai trò không hợp lệ." };
    }

    
    const cred = await createUserWithEmailAndPassword(
      auth,
      userData.email.trim().toLowerCase(),
      userData.password
    );

    const uid = cred.user.uid;
    const token = await cred.user.getIdToken(); 

    


    
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

    
    const finalUser = { 
      id: postgresUser?.id || uid, 
      postgres_id: postgresUser?.id, 
      email: userData.email.trim().toLowerCase(), 
      role: "user", 
      fullName: postgresUser?.name || userData.fullName,
      phone: postgresUser?.phone_number || userData.phone,
      ...postgresUser 
    };
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



async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

    const uid = cred.user.uid;
    const token = await cred.user.getIdToken(); 

    let user = { id: uid, email: email, role: "user" }; 
    


    
    try {
      const syncRes = await fetch("/api/users/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({}) 
      });
      if (syncRes.ok) {
        const postgresUser = await syncRes.json();
        
        user = { 
          ...user, 
          postgres_id: postgresUser.id, 
          id: postgresUser.id || uid, 
          role: postgresUser.role || "user", 
          fullName: postgresUser.name,
          phone: postgresUser.phone_number
        };
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


async function loginWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const uid = cred.user.uid;
    const email = cred.user.email;
    const token = await cred.user.getIdToken(); 
    const displayName = cred.user.displayName;

    let user = { id: uid, email: email, role: "user" };

    
    try {
      const syncRes = await fetch("/api/users/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ fullName: displayName })
      });
      if (syncRes.ok) {
        const postgresUser = await syncRes.json();
        
        user = { 
          ...user, 
          postgres_id: postgresUser.id, 
          id: postgresUser.id || uid, 
          role: postgresUser.role || "user", 
          fullName: postgresUser.name || displayName,
          phone: postgresUser.phone_number
        };
      } else {
        console.warn("Backend sync failed", await syncRes.text());
      }
    } catch (e) {
      console.warn("Could not reach backend sync", e);
    }

    setCurrentUser(user);

    return { success: true, message: "Đăng nhập Google thành công!", user };
  } catch (err) {
    console.error("Lỗi đăng nhập Google:", err);
    return { success: false, message: "Đăng nhập Google thất bại hoặc bị hủy." };
  }
}


async function logout() {
  await signOut(auth);
  sessionStorage.removeItem("currentUser");
  return { success: true, message: "Đăng xuất thành công!" };
}


function getCurrentUser() {
  const raw = sessionStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}


function isLoggedIn() {
  return getCurrentUser() !== null;
}

function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === "admin";
}


async function updateCurrentUser(updatedData) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Bạn chưa đăng nhập." };
  }

  try {
    const token = await getValidToken();
    if (!token) {
      return { success: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
    }

    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: updatedData.fullName || updatedData.name,
        phone: updatedData.phone || updatedData.phone_number,
        address: updatedData.address
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, message: `Lỗi đồng bộ server: ${errorText}` };
    }

    const data = await res.json();
    if (data.success && data.user) {
      const postgresUser = data.user;
      const mergedUser = {
        ...currentUser,
        postgres_id: postgresUser.id,
        id: postgresUser.id,
        fullName: postgresUser.name,
        name: postgresUser.name,
        phone: postgresUser.phone_number,
        phone_number: postgresUser.phone_number,
        address: postgresUser.address,
        role: postgresUser.role || currentUser.role
      };
      setCurrentUser(mergedUser);
      return { success: true, message: "Cập nhật thông tin thành công!", user: mergedUser };
    } else {
      return { success: false, message: data.message || "Không thể cập nhật thông tin." };
    }
  } catch (err) {
    console.error("Update profile error:", err);
    return { success: false, message: "Lỗi kết nối máy chủ." };
  }
}


async function syncUserProfile() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  try {
    const token = await getValidToken();
    if (!token) return currentUser;

    const res = await fetch("/api/users/profile", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const postgresUser = await res.json();
      const mergedUser = {
        ...currentUser,
        postgres_id: postgresUser.id,
        id: postgresUser.id,
        fullName: postgresUser.name,
        name: postgresUser.name,
        phone: postgresUser.phone_number,
        phone_number: postgresUser.phone_number,
        address: postgresUser.address,
        role: postgresUser.role || currentUser.role
      };
      setCurrentUser(mergedUser);
      return mergedUser;
    }
  } catch (err) {
    console.warn("Could not sync user profile from server:", err);
  }
  return currentUser;
}



async function changePassword(oldPassword, newPassword) {
  if (!validatePassword(newPassword)) {
    return { success: false, message: "Mật khẩu mới ≥ 6 ký tự." };
  }

  return {
    success: false,
    message: "Đổi mật khẩu dùng Firebase Auth (reauth required)."
  };
}


async function setUserAsAdmin(userId) {
  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" })
    });
    const data = await res.json();
    return { success: data.success, message: data.message || "Đã cấp quyền admin!" };
  } catch (e) {
    return { success: false, message: "Lỗi kết nối server." };
  }
}


async function removeAdminRole(userId) {
  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user" })
    });
    const data = await res.json();
    return { success: data.success, message: data.message || "Đã gỡ quyền admin!" };
  } catch (e) {
    return { success: false, message: "Lỗi kết nối server." };
  }
}

export { register, login, loginWithGoogle, logout, getCurrentUser, isLoggedIn, isAdmin, updateCurrentUser, changePassword, setUserAsAdmin, removeAdminRole, syncUserProfile, validateEmail, validatePhone, validatePassword };

window.register = register;
window.login = login;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.isAdmin = isAdmin;
window.updateCurrentUser = updateCurrentUser;
window.changePassword = changePassword;
window.setUserAsAdmin = setUserAsAdmin;
window.removeAdminRole = removeAdminRole;
window.syncUserProfile = syncUserProfile;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validatePassword = validatePassword;
