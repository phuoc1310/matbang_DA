// controllers/user.controller.js
import { findOrCreateUser, getUserByUid, updateUserByUid } from "../services/user.service.js";

export async function syncUser(req, res) {
  const { uid, email, name, picture, phone_number } = req.user;
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
}

export async function getUserProfile(req, res) {
  const { uid } = req.user;
  const user = await getUserByUid(uid);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.json(user);
}

export async function updateUserProfile(req, res) {
  const { uid } = req.user;
  const { fullName, name, phone, phone_number, address } = req.body;
  
  const updatedFields = {
    name: fullName || name || null,
    phone_number: phone || phone_number || null,
    address: address || null
  };

  const user = await updateUserByUid(uid, updatedFields);
  res.json({ success: true, message: "Cập nhật thành công!", user });
}