import { auth } from "../config/firebase.js"; 
import { 
    onAuthStateChanged, 
    signOut,
    signInWithEmailAndPassword, // Thêm cái này
    createUserWithEmailAndPassword // Thêm cái này
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const authService = {
    // Đăng ký tài khoản mới
    async register(email, password) {
        // Không dùng try-catch ở đây để đẩy lỗi về cho phía gọi (onboarding.js) xử lý giao diện
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    // Đăng nhập
    async login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem("token", token); 
        return userCredential.user;
    },

    // 1. Kiểm tra trạng thái đăng nhập liên tục
    checkAuthState(callback) {
        onAuthStateChanged(auth, (user) => {
            callback(user);
        });
    },

    // 2. Lấy Token mới nhất để gửi cho Backend
    async getToken() {
        const user = auth.currentUser;
        return user ? await user.getIdToken() : null;
    },

    // 3. Đăng xuất
    async logout() {
        try {
            await signOut(auth);
            localStorage.removeItem("token");
            window.location.href = "/dangnhap.html";
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    }
};
