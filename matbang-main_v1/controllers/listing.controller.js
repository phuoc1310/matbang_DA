import { getListings } from "../services/listing.service.js";

export async function getListingsController(req, res) {
  try {
    const data = await getListings(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}