// controllers/user.controller.js
import { findOrCreateUser } from "../services/user.service.js";

export async function syncUser(req, res) {
  try {
    // req.user chứa payload từ Firebase JWT Token
    const { uid, email, name, picture, phone_number } = req.user;
    
    // req.body chứa thông tin thêm từ lúc đăng ký (nếu có)
    const fallbackName = req.body.fullName || req.body.name || name || "No Name";
    const fallbackPhone = req.body.phone || phone_number || null;

    const user = await findOrCreateUser({
      uid,
      email,
      name: fallbackName,
      avatar_url: picture || null,
      phone_number: fallbackPhone
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}