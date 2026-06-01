import * as InteractionService from "../services/interaction.service.js";

export const getSearchHistory = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  res.json(await InteractionService.getSearchHistory(userId));
};

export const addSearchHistory = async (req, res) => {
  const { userId, keyword, city } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  if (!keyword && !city) return res.status(400).json({ error: "No search criteria provided" });
  res.json(await InteractionService.addSearchHistory(userId, keyword, city));
};

export const clearSearchHistory = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  res.json(await InteractionService.clearSearchHistory(userId));
};

export const getCompareList = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  res.json(await InteractionService.getCompareList(userId));
};

export const toggleCompare = async (req, res) => {
  const { userId, propertyId } = req.body;
  if (!userId || !propertyId) return res.status(400).json({ error: "Missing userId or propertyId" });
  const result = await InteractionService.toggleCompare(userId, propertyId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
};

export const clearCompareList = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  res.json(await InteractionService.clearCompareList(userId));
};
