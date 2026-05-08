import {
  getListings,
  compareListings,
  createListing
} from "../services/listing.service.js";

export async function createListingController(req, res) {
  try {
    const user_id = req.user.id;

    const data = await createListing(req.body, user_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export async function getListingsController(req, res) {
  try {
    const data = await getListings(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export async function getListingController(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const data = await getListingById(id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export async function compareListingsController(req, res) {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: "Missing ids" });
    }

    const data = await compareListings(ids);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}