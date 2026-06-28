import {
  getListings,
  compareListings,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
  updateListingStatus,
  toggleListingVisibility
} from "../services/listing.service.js";
import db from "../config/db.js";

async function getDbUserId(req) {
  const firebase_uid = req.user?.uid;
  if (!firebase_uid) return null;
  const res = await db.query(`SELECT id FROM users WHERE firebase_uid = $1 LIMIT 1`, [firebase_uid]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

export async function createListingController(req, res) {
  const user_id = await getDbUserId(req);
  const data = await createListing(req.body, user_id);
  res.json(data);
}

export async function getListingsController(req, res) {
  const data = await getListings(req.query);
  res.json(data);
}

export async function getListingController(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const data = await getListingById(id);
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
}

export async function compareListingsController(req, res) {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: "Missing ids" });

  const data = await compareListings(ids);
  res.json(data);
}

export async function updateListingController(req, res) {
  const { id } = req.params;
  const user_id = await getDbUserId(req);
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const data = await updateListing(id, req.body, user_id);
  if (!data) return res.status(404).json({ error: 'Not found or unauthorized' });
  res.json(data);
}

export async function deleteListingController(req, res) {
  const { id } = req.params;
  const user_id = await getDbUserId(req);
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const success = await deleteListing(id, user_id);
  if (!success) return res.status(404).json({ error: 'Not found or unauthorized' });
  res.json({ success: true });
}

export async function updateListingStatusController(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const data = await updateListingStatus(id, status);
  res.json(data);
}

export async function toggleListingVisibilityController(req, res) {
  const { id } = req.params;
  const user_id = await getDbUserId(req);
  const data = await toggleListingVisibility(id, user_id);
  if (!data) return res.status(404).json({ error: 'Not found or unauthorized' });
  res.json(data);
}