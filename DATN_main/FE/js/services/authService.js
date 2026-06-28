import { auth } from "../config/firebase.js"; 
import { 
    onAuthStateChanged, 
    signOut,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const authService = {
    
    async register(email, password) {
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    
    async login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem("token", token); 
        return userCredential.user;
    },

    
    checkAuthState(callback) {
        onAuthStateChanged(auth, (user) => {
            callback(user);
        });
    },

    
    async getToken() {
        const user = auth.currentUser;
        return user ? await user.getIdToken() : null;
    },

    
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
