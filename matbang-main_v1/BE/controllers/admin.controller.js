import * as AdminService from "../services/admin.service.js";

export const getDashboardStats = async (req, res) => {
  const stats = await AdminService.getDashboardStats();
  res.json({ success: true, stats });
};

export const getUsers = async (req, res) => {
  const users = await AdminService.getUsers();
  res.json({ success: true, users });
};

export const getUserById = async (req, res) => {
  const user = await AdminService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
  res.json({ success: true, user });
};

export const updateUser = async (req, res) => {
  const user = await AdminService.updateUser(req.params.id, req.body);
  if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
  res.json({ success: true, user });
};

export const deleteUser = async (req, res) => {
  const result = await AdminService.deleteUser(req.params.id);
  if (result.error) return res.status(result.status).json({ success: false, message: result.error });
  res.json({ success: true, message: "Đã xóa người dùng" });
};

export const updateUserRole = async (req, res) => {
  const result = await AdminService.updateUserRole(req.params.id, req.body.role);
  if (result.error) return res.status(result.status).json({ success: false, message: result.error });
  res.json({ success: true, user: result.user, message: `Đã cập nhật role thành ${req.body.role}` });
};

export const getListings = async (req, res) => {
  const data = await AdminService.getListings(req.query);
  res.json({ success: true, ...data });
};

export const getListingStats = async (req, res) => {
  const stats = await AdminService.getListingStats();
  res.json({ success: true, stats });
};

export const updateListingStatus = async (req, res) => {
  const result = await AdminService.updateListingStatus(req.params.id, req.body.status);
  if (result.error) return res.status(result.status).json({ success: false, message: result.error });
  res.json({ success: true, listing: result.listing });
};

export const deleteListing = async (req, res) => {
  const deleted = await AdminService.deleteListing(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy tin đăng" });
  res.json({ success: true, message: "Đã xóa tin đăng" });
};

export const getContacts = async (req, res) => {
  const contacts = await AdminService.getContacts();
  res.json({ success: true, contacts });
};

export const getContactById = async (req, res) => {
  const contact = await AdminService.getContactById(req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: "Không tìm thấy liên hệ" });
  res.json({ success: true, contact });
};

export const updateContactStatus = async (req, res) => {
  const contact = await AdminService.updateContactStatus(req.params.id, req.body.status);
  if (!contact) return res.status(404).json({ success: false, message: "Không tìm thấy liên hệ" });
  res.json({ success: true, contact });
};

export const deleteContact = async (req, res) => {
  const deleted = await AdminService.deleteContact(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy liên hệ" });
  res.json({ success: true, message: "Đã xóa liên hệ" });
};

export const getFeedbacks = async (req, res) => {
  const feedbacks = await AdminService.getFeedbacks();
  res.json({ success: true, feedbacks });
};

export const getFeedbackById = async (req, res) => {
  const feedback = await AdminService.getFeedbackById(req.params.id);
  if (!feedback) return res.status(404).json({ success: false, message: "Không tìm thấy phản hồi" });
  res.json({ success: true, feedback });
};

export const updateFeedbackStatus = async (req, res) => {
  const feedback = await AdminService.updateFeedbackStatus(req.params.id, req.body.status);
  if (!feedback) return res.status(404).json({ success: false, message: "Không tìm thấy phản hồi" });
  res.json({ success: true, feedback });
};

export async function deleteFeedback(req, res) {
  const deleted = await AdminService.deleteFeedback(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy phản hồi" });
  res.json({ success: true, message: "Đã xóa phản hồi" });
}

export const getReviews = async (req, res) => {
  const reviews = await AdminService.getReviews();
  res.json({ success: true, reviews });
};

export const deleteReview = async (req, res) => {
  const deleted = await AdminService.deleteReview(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
  res.json({ success: true, message: "Đã xóa đánh giá" });
};
