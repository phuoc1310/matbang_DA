// controllers/user.controller.js
import { findOrCreateUser } from "../services/user.service.js";

export async function syncUser(req, res) {
  try {
    const { uid, email, name } = req.user;

    const user = await findOrCreateUser({
      uid,
      email,
      name
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}