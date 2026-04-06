// ================== ADMIN MODULE ==================
// Quản lý tài khoản người dùng cho admin

import { setUserAsAdmin, removeAdminRole, logout } from "./auth/auth.js";

// Helper function for phone validation
function validatePhone(phone) {
    return /^[0-9]{10,11}$/.test(phone.replace(/\s/g, ""));
}

// Helper function to get backend URL
function getBackendUrl() {
    return localStorage.getItem('admin_backend_url') || 'http://localhost:3033';
}

let allUsers = [];
let filteredUsers = [];
let userToDelete = null;

// ================== INITIALIZE ==================
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is admin
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showMessage('Bạn chưa đăng nhập. Đang chuyển hướng...', 'error');
        setTimeout(() => {
            window.location.href = 'dangnhap.html';
        }, 1500);
        return;
    }
    
    if (!isAdmin()) {
        showMessage('Bạn không có quyền truy cập trang này. Chỉ admin mới có thể truy cập.', 'error');
        setTimeout(() => {
            window.location.href = 'taikhoan.html';
        }, 2000);
        return;
    }
    
    // Admin mặc định đã được tạo tự động trong initUsersStorage()
    loadUsers();
    setupEventListeners();
    setupNavigation();
    
    // Load dashboard by default
    navigateTo('dashboard');
    
    // Update user info in sidebar
    updateSidebarUserInfo();
});

// ================== LOAD USERS ==================
async function loadUsers() {
    try {
        const backendUrl = localStorage.getItem('admin_backend_url') || 'http://localhost:3033';
        const response = await fetch(`${backendUrl}/api/admin/users`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.users) {
            allUsers = result.users;
            filteredUsers = [...allUsers];
            renderUsers();
            updateStatistics();
        } else {
            throw new Error(result.error || 'Khong nhan duoc du lieu');
        }
    } catch (error) {
        console.error('Lỗi tải danh sách người dùng:', error);
        showMessage('Không thể tải danh sách người dùng.', 'error');
    }
}

// ================== UPDATE STATISTICS ==================
function updateStatistics() {
    const total = allUsers.length;
    const nguoithue = allUsers.filter(u => u.role === 'nguoithue').length;
    const chumattbang = allUsers.filter(u => u.role === 'chumattbang').length;
    const admin = allUsers.filter(u => u.role === 'admin').length;
    const vip = allUsers.filter(u => u.vipStatus === true).length;
    
    // Update statistics cards if they exist (for backward compatibility)
    const statTotal = document.getElementById('stat-total');
    const statNguoithue = document.getElementById('stat-nguoithue');
    const statChumattbang = document.getElementById('stat-chumattbang');
    const statVip = document.getElementById('stat-vip');
    
    if (statTotal) statTotal.textContent = total;
    if (statNguoithue) statNguoithue.textContent = nguoithue;
    if (statChumattbang) statChumattbang.textContent = chumattbang;
    if (statVip) statVip.textContent = vip;
}

// ================== RENDER USERS ==================
function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    const noResults = document.getElementById('no-results');
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    const currentUser = getCurrentUser();
    
    tbody.innerHTML = filteredUsers.map(user => {
        // Role badge
        let roleBadge = '';
        if (user.role === 'admin') {
            roleBadge = '<span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-semibold">Admin</span>';
        } else if (user.role === 'chumattbang') {
            roleBadge = '<span class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">Chủ mặt bằng</span>';
        } else {
            roleBadge = '<span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-semibold">Người thuê</span>';
        }
        
        const vipBadge = user.vipStatus
            ? '<span class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-semibold">VIP</span>'
            : '<span class="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs font-semibold">Thường</span>';
        
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A';
        const shortId = user.id.length > 20 ? user.id.substring(0, 20) + '...' : user.id;
        
        // Admin action buttons (chỉ hiển thị nếu không phải chính mình)
        const isCurrentUser = currentUser && currentUser.id === user.id;
        let adminActionBtn = '';
        if (!isCurrentUser) {
            if (user.role === 'admin') {
                adminActionBtn = `<button onclick="confirmRemoveAdmin('${user.id}')" class="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors" title="Gỡ quyền admin">
                    <span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                </button>`;
            } else {
                adminActionBtn = `<button onclick="confirmSetAdmin('${user.id}')" class="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="Cấp quyền admin">
                    <span class="material-symbols-outlined text-[18px]">shield</span>
                </button>`;
            }
        }
        
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-slate-900 dark:text-white font-mono" title="${user.id}">${shortId}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-900 dark:text-white">${user.fullName || 'Chưa cập nhật'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-slate-900 dark:text-white">${user.email}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-slate-900 dark:text-white">${user.phone || 'Chưa cập nhật'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${roleBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${vipBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-600 dark:text-slate-400">${createdAt}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex gap-2">
                        <button onclick="viewUserDetail('${user.id}')" class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Xem chi tiết">
                            <span class="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button onclick="editUser('${user.id}')" class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Chỉnh sửa">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        ${adminActionBtn}
                        <button onclick="confirmDeleteUser('${user.id}')" class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Xóa">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ================== FILTER USERS ==================
function filterUsers() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const roleFilter = document.getElementById('filter-role').value;
    const vipFilter = document.getElementById('filter-vip').value;
    
    filteredUsers = allUsers.filter(user => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.phone && user.phone.includes(searchTerm)) ||
            user.id.toLowerCase().includes(searchTerm);
        
        // Role filter
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        
        // VIP filter
        const matchesVip = vipFilter === 'all' || 
            (vipFilter === 'true' && user.vipStatus === true) ||
            (vipFilter === 'false' && user.vipStatus !== true);
        
        return matchesSearch && matchesRole && matchesVip;
    });
    
    renderUsers();
}

// ================== VIEW USER DETAIL ==================
function viewUserDetail(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showMessage('Không tìm thấy người dùng.', 'error');
        return;
    }
    
    let roleText = 'Người thuê';
    if (user.role === 'admin') {
        roleText = 'Quản trị viên';
    } else if (user.role === 'chumattbang') {
        roleText = 'Chủ mặt bằng';
    }
    const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : 'N/A';
    const vipExpiry = user.vipExpiry ? new Date(user.vipExpiry).toLocaleString('vi-VN') : 'N/A';
    
    const modalContent = document.getElementById('user-modal-content');
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">ID</p>
                    <p class="text-sm font-mono text-slate-900 dark:text-white break-all">${user.id}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${user.email}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Họ và tên</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${user.fullName || 'Chưa cập nhật'}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Số điện thoại</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${user.phone || 'Chưa cập nhật'}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Địa chỉ</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${user.address || 'Chưa cập nhật'}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Vai trò</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${roleText}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Trạng thái VIP</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${user.vipStatus ? 'Có VIP' : 'Không VIP'}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">VIP hết hạn</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${vipExpiry}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Xác thực</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${user.verified ? 'Đã xác thực' : 'Chưa xác thực'}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Ngày tạo</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${createdAt}</p>
                </div>
            </div>
            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Thống kê</p>
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p class="text-slate-600 dark:text-slate-400">Tin đã lưu</p>
                        <p class="font-semibold text-slate-900 dark:text-white">${user.savedListings?.length || 0}</p>
                    </div>
                    <div>
                        <p class="text-slate-600 dark:text-slate-400">Tin đã xem</p>
                        <p class="font-semibold text-slate-900 dark:text-white">${user.viewedListings?.length || 0}</p>
                    </div>
                    <div>
                        <p class="text-slate-600 dark:text-slate-400">Tin đã đăng</p>
                        <p class="font-semibold text-slate-900 dark:text-white">${user.myListings?.length || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('user-modal').classList.remove('hidden');
}

// ================== EDIT USER ==================
let editingUserId = null;

function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showMessage('Không tìm thấy người dùng.', 'error');
        return;
    }
    
    // Không cho phép chỉnh sửa admin từ đây (phải dùng chức năng riêng)
    if (user.role === 'admin') {
        showMessage('Không thể chỉnh sửa thông tin admin từ đây. Vui lòng dùng trang tài khoản cá nhân.', 'error');
        return;
    }
    
    editingUserId = userId;
    
    // Điền dữ liệu vào form
    document.getElementById('edit-user-fullName').value = user.fullName || '';
    document.getElementById('edit-user-phone').value = user.phone || '';
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-address').value = user.address || '';
    document.getElementById('edit-user-role').value = user.role === 'admin' ? 'nguoithue' : user.role;
    
    // Hiển thị modal
    document.getElementById('edit-modal').classList.remove('hidden');
}

// ================== SAVE EDITED USER ==================
async function saveEditedUser() {
    if (!editingUserId) return;
    
    const user = allUsers.find(u => u.id === editingUserId);
    if (!user) {
        showMessage('Không tìm thấy người dùng.', 'error');
        return;
    }
    
    const newFullName = document.getElementById('edit-user-fullName').value.trim();
    const newPhone = document.getElementById('edit-user-phone').value.trim();
    const newAddress = document.getElementById('edit-user-address').value.trim();
    const newRole = document.getElementById('edit-user-role').value;
    
    // Validate phone if provided
    if (newPhone && !validatePhone(newPhone)) {
        showMessage('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 số.', 'error');
        return;
    }
    
    // Không cho phép đổi role thành admin từ đây
    if (newRole === 'admin') {
        showMessage('Không thể đổi vai trò thành admin từ đây. Vui lòng dùng nút "Cấp quyền admin".', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/users/${editingUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: newFullName,
                phone: newPhone,
                address: newAddress,
                role: newRole
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Nếu là user đang đăng nhập, cập nhật currentUser trong sessionStorage
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === editingUserId) {
                const updatedUser = { ...currentUser, fullName: newFullName, phone: newPhone, address: newAddress, role: newRole };
                sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
            
            await loadUsers(); // Reload
            showMessage('Cập nhật thông tin người dùng thành công!', 'success');
            
            // Đóng modal
            document.getElementById('edit-modal').classList.add('hidden');
            editingUserId = null;
        } else {
            throw new Error(result.message || 'Loi cap nhat');
        }
    } catch (error) {
        console.error('Lỗi cập nhật người dùng:', error);
        showMessage('Đã xảy ra lỗi khi cập nhật thông tin.', 'error');
    }
}

// ================== CONFIRM DELETE USER ==================
function confirmDeleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showMessage('Không tìm thấy người dùng.', 'error');
        return;
    }
    
    userToDelete = userId;
    document.getElementById('delete-confirm-text').textContent = 
        `Bạn có chắc chắn muốn xóa tài khoản "${user.fullName || user.email}"? Hành động này không thể hoàn tác.`;
    document.getElementById('delete-modal').classList.remove('hidden');
}

// ================== DELETE USER ==================
async function deleteUser(userId) {
    try {
        const user = allUsers.find(u => u.id === userId);
        
        // Không cho phép xóa admin (bảo vệ hệ thống)
        if (user && user.role === 'admin') {
            showMessage('Không thể xóa tài khoản admin. Vui lòng gỡ quyền admin trước.', 'error');
            return;
        }
        
        const response = await fetch(`${getBackendUrl()}/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Also remove from currentUser if it's the deleted user
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                sessionStorage.removeItem('currentUser');
            }
            
            await loadUsers(); // Reload
            showMessage('Xóa tài khoản thành công!', 'success');
        } else {
            throw new Error(result.message || 'Loi xoa');
        }
    } catch (error) {
        console.error('Lỗi xóa người dùng:', error);
        showMessage('Đã xảy ra lỗi khi xóa tài khoản.', 'error');
    }
}

// ================== CONFIRM SET ADMIN ==================
let adminActionUserId = null;
let adminActionType = null; // 'set' or 'remove'

function confirmSetAdmin(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showMessage('Không tìm thấy người dùng.', 'error');
        return;
    }
    
    adminActionUserId = userId;
    adminActionType = 'set';
    document.getElementById('admin-confirm-text').textContent = 
        `Bạn có chắc chắn muốn cấp quyền admin cho "${user.fullName || user.email}"?`;
    document.getElementById('admin-confirm-title').textContent = 'Cấp quyền admin';
    document.getElementById('admin-confirm-icon').textContent = 'shield';
    document.getElementById('admin-confirm-btn').textContent = 'Cấp quyền';
    document.getElementById('admin-confirm-btn').className = 'flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors';
    document.getElementById('admin-modal').classList.remove('hidden');
}

// ================== CONFIRM REMOVE ADMIN ==================
function confirmRemoveAdmin(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showMessage('Không tìm thấy người dùng.', 'error');
        return;
    }
    
    adminActionUserId = userId;
    adminActionType = 'remove';
    document.getElementById('admin-confirm-text').textContent = 
        `Bạn có chắc chắn muốn gỡ quyền admin của "${user.fullName || user.email}"?`;
    document.getElementById('admin-confirm-title').textContent = 'Gỡ quyền admin';
    document.getElementById('admin-confirm-icon').textContent = 'admin_panel_settings';
    document.getElementById('admin-confirm-btn').textContent = 'Gỡ quyền';
    document.getElementById('admin-confirm-btn').className = 'flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors';
    document.getElementById('admin-modal').classList.remove('hidden');
}

// ================== SETUP EVENT LISTENERS ==================
function setupEventListeners() {
    // Search input
    document.getElementById('search-input').addEventListener('input', filterUsers);
    
    // Filter selects
    document.getElementById('filter-role').addEventListener('change', filterUsers);
    document.getElementById('filter-vip').addEventListener('change', filterUsers);
    
    // Modal close
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('user-modal').classList.add('hidden');
    });
    
    // Click outside modal to close
    document.getElementById('user-modal').addEventListener('click', (e) => {
        if (e.target.id === 'user-modal') {
            document.getElementById('user-modal').classList.add('hidden');
        }
    });
    
    // Delete confirmation
    document.getElementById('confirm-delete').addEventListener('click', () => {
        if (userToDelete) {
            deleteUser(userToDelete);
            document.getElementById('delete-modal').classList.add('hidden');
            userToDelete = null;
        }
    });
    
    document.getElementById('cancel-delete').addEventListener('click', () => {
        document.getElementById('delete-modal').classList.add('hidden');
        userToDelete = null;
    });
    
    // Click outside delete modal to close
    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target.id === 'delete-modal') {
            document.getElementById('delete-modal').classList.add('hidden');
            userToDelete = null;
        }
    });
    
    // Edit modal
    document.getElementById('close-edit-modal').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.add('hidden');
        editingUserId = null;
    });
    
    document.getElementById('cancel-edit-user').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.add('hidden');
        editingUserId = null;
    });
    
    // Click outside edit modal to close
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            document.getElementById('edit-modal').classList.add('hidden');
            editingUserId = null;
        }
    });
    
    // Edit user form submit
    document.getElementById('edit-user-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditedUser();
    });
    
    // Admin action confirmation
    document.getElementById('admin-confirm-btn').addEventListener('click', async () => {
        if (adminActionUserId && adminActionType) {
            if (adminActionType === 'set') {
                const result = await setUserAsAdmin(adminActionUserId);
                if (result.success) {
                    showMessage(result.message, 'success');
                    await loadUsers();
                } else {
                    showMessage(result.message, 'error');
                }
            } else if (adminActionType === 'remove') {
                const result = await removeAdminRole(adminActionUserId);
                if (result.success) {
                    showMessage(result.message, 'success');
                    await loadUsers();
                } else {
                    showMessage(result.message, 'error');
                }
            }
            document.getElementById('admin-modal').classList.add('hidden');
            adminActionUserId = null;
            adminActionType = null;
        }
    });
    
    document.getElementById('cancel-admin-action').addEventListener('click', () => {
        document.getElementById('admin-modal').classList.add('hidden');
        adminActionUserId = null;
        adminActionType = null;
    });
    
    // Click outside admin modal to close
    document.getElementById('admin-modal').addEventListener('click', (e) => {
        if (e.target.id === 'admin-modal') {
            document.getElementById('admin-modal').classList.add('hidden');
            adminActionUserId = null;
            adminActionType = null;
        }
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        const result = await logout();
        if (result.success) {
            showMessage('Đăng xuất thành công! Đang chuyển hướng...', 'success');
            setTimeout(() => {
                window.location.href = 'dangnhap.html';
            }, 800);
        } else {
            showMessage('Có lỗi xảy ra: ' + result.message, 'error');
        }
    });
    
    // This is now handled in setupNavigation()
    
    // Contact filter
    const filterContactStatus = document.getElementById('filter-contact-status');
    if (filterContactStatus) {
        filterContactStatus.addEventListener('change', () => {
            loadContacts();
        });
    }
    
    // Feedback filter
    const filterFeedbackStatus = document.getElementById('filter-feedback-status');
    if (filterFeedbackStatus) {
        filterFeedbackStatus.addEventListener('change', () => {
            loadFeedbacks();
        });
    }
    
    // Contact modal close
    document.querySelectorAll('.close-contact-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('contact-modal').classList.add('hidden');
        });
    });
    
    // Feedback modal close
    document.querySelectorAll('.close-feedback-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('feedback-modal').classList.add('hidden');
        });
    });
}

// ================== NAVIGATION MANAGEMENT ==================
function setupNavigation() {
    // Tab navigation (deprecated, for backward compatibility)
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            navigateTo(tabName);
        });
    });
    
    // Sidebar toggle for mobile
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }
}

async function navigateTo(sectionName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.nav === sectionName) {
            item.className = 'nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors bg-primary/10 text-primary border-l-4 border-primary';
        } else {
            item.className = 'nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800';
        }
    });
    
    // Update page title
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Tổng quan hệ thống' },
        users: { title: 'Quản lý người dùng', subtitle: 'Danh sách và thông tin người dùng' },
        contacts: { title: 'Quản lý liên hệ', subtitle: 'Tin nhắn từ khách hàng' },
        feedbacks: { title: 'Quản lý phản hồi', subtitle: 'Đánh giá và góp ý từ người dùng' }
    };
    
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    if (pageTitle && titles[sectionName]) {
        pageTitle.textContent = titles[sectionName].title;
        pageSubtitle.textContent = titles[sectionName].subtitle;
    }
    
    // Show/hide sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    const activeSection = document.getElementById(`section-${sectionName}`);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }
    
    // Load data for active section
    if (sectionName === 'dashboard') {
        if (typeof initDashboard === 'function') {
            initDashboard();
        }
    } else if (sectionName === 'users') {
        await loadUsers();
    } else if (sectionName === 'contacts') {
        loadContacts();
    } else if (sectionName === 'feedbacks') {
        loadFeedbacks();
    }
    
    // Close sidebar on mobile after navigation
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
    }
}

// Export to global scope for inline onclick handlers
window.navigateTo = navigateTo;
window.viewUserDetail = viewUserDetail;
window.editUser = editUser;
window.confirmDeleteUser = confirmDeleteUser;
window.confirmSetAdmin = confirmSetAdmin;
window.confirmRemoveAdmin = confirmRemoveAdmin;
window.saveEditedUser = saveEditedUser;
window.deleteUser = deleteUser;
window.viewContact = viewContact;
window.markContactProcessed = markContactProcessed;
window.deleteContactAdmin = deleteContactAdmin;
window.analyzeContactSentiment = analyzeContactSentiment;
window.viewFeedback = viewFeedback;
window.markFeedbackReviewed = markFeedbackReviewed;
window.deleteFeedbackAdmin = deleteFeedbackAdmin;
window.analyzeFeedbackSentiment = analyzeFeedbackSentiment;

function updateSidebarUserInfo() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    if (userAvatar && currentUser.fullName) {
        userAvatar.textContent = currentUser.fullName.charAt(0).toUpperCase();
    }
    
    if (userName) {
        userName.textContent = currentUser.fullName || 'Admin';
    }
    
    if (userEmail) {
        userEmail.textContent = currentUser.email || '';
    }
}

// Backward compatibility
function switchTab(tabName) {
    navigateTo(tabName);
}

// ================== CONTACTS MANAGEMENT ==================
function loadContacts() {
    if (typeof getContacts !== 'function') {
        console.error('contact.js chưa được load');
        return;
    }
    
    const contacts = getContacts();
    const filterStatus = document.getElementById('filter-contact-status')?.value || 'all';
    
    let filteredContacts = contacts;
    if (filterStatus !== 'all') {
        filteredContacts = contacts.filter(c => c.status === filterStatus);
    }
    
    // Sort by date (newest first)
    filteredContacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    renderContacts(filteredContacts);
}

function renderContacts(contacts) {
    const tbody = document.getElementById('contacts-table-body');
    if (!tbody) return;
    
    if (contacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <span class="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                    Chưa có liên hệ nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = contacts.map(contact => {
        const date = new Date(contact.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            processed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        };
        
        const statusTexts = {
            pending: 'Chưa xử lý',
            processed: 'Đã xử lý',
            resolved: 'Đã giải quyết'
        };
        
        const subjectTexts = {
            tuvan: 'Tư vấn tìm mặt bằng',
            dangtin: 'Hỗ trợ đăng tin',
            vip: 'Gói VIP',
            kythuat: 'Hỗ trợ kỹ thuật',
            khac: 'Khác'
        };
        
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-6 py-4 text-sm">${escapeHtml(contact.fullName)}</td>
                <td class="px-6 py-4 text-sm">${escapeHtml(contact.email)}</td>
                <td class="px-6 py-4 text-sm">${contact.phone || '-'}</td>
                <td class="px-6 py-4 text-sm">${subjectTexts[contact.subject] || contact.subject}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[contact.status] || statusColors.pending}">
                        ${statusTexts[contact.status] || 'Chưa xử lý'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${date}</td>
                <td class="px-6 py-4 text-sm">
                    <div class="flex gap-2">
                        <button onclick="viewContact('${contact.id}')" class="text-primary hover:text-primary-dark transition-colors" title="Xem chi tiết">
                            <span class="material-symbols-outlined">visibility</span>
                        </button>
                        ${contact.status !== 'resolved' ? `
                            <button onclick="markContactProcessed('${contact.id}')" class="text-blue-600 hover:text-blue-700 transition-colors" title="Đánh dấu đã xử lý">
                                <span class="material-symbols-outlined">check_circle</span>
                            </button>
                        ` : ''}
                        <button onclick="deleteContactAdmin('${contact.id}')" class="text-red-600 hover:text-red-700 transition-colors" title="Xóa">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewContact(id) {
    if (typeof getContactById !== 'function') return;
    
    const contact = getContactById(id);
    if (!contact) {
        showMessage('Không tìm thấy liên hệ', 'error');
        return;
    }
    
    const modalContent = document.getElementById('contact-modal-content');
    const date = new Date(contact.createdAt).toLocaleString('vi-VN');
    const processedDate = contact.processedAt ? new Date(contact.processedAt).toLocaleString('vi-VN') : '-';
    
    const subjectTexts = {
        tuvan: 'Tư vấn tìm mặt bằng',
        dangtin: 'Hỗ trợ đăng tin',
        vip: 'Gói VIP',
        kythuat: 'Hỗ trợ kỹ thuật',
        khac: 'Khác'
    };
    
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Họ và tên</label>
                <p class="text-slate-900 dark:text-white">${escapeHtml(contact.fullName)}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Email</label>
                <p class="text-slate-900 dark:text-white">${escapeHtml(contact.email)}</p>
            </div>
            ${contact.phone ? `
                <div>
                    <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Số điện thoại</label>
                    <p class="text-slate-900 dark:text-white">${escapeHtml(contact.phone)}</p>
                </div>
            ` : ''}
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Chủ đề</label>
                <p class="text-slate-900 dark:text-white">${subjectTexts[contact.subject] || contact.subject}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Nội dung</label>
                <p class="text-slate-900 dark:text-white whitespace-pre-wrap">${escapeHtml(contact.content)}</p>
            </div>
            
            <!-- AI Sentiment Analysis -->
            <div class="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div class="flex items-center justify-between mb-3">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span class="material-symbols-outlined text-blue-600">psychology</span>
                        Phân tích AI (Sentiment)
                    </label>
                    <button onclick="analyzeContactSentiment('${id}')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">refresh</span>
                        Phân tích
                    </button>
                </div>
                <div id="sentiment-result-${id}" class="text-sm text-slate-600 dark:text-slate-400">
                    Nhấn "Phân tích" để xem phân tích cảm xúc AI...
                </div>
            </div>
            
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Trạng thái</label>
                <p class="text-slate-900 dark:text-white">${contact.status === 'pending' ? 'Chưa xử lý' : contact.status === 'processed' ? 'Đã xử lý' : 'Đã giải quyết'}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Ngày gửi</label>
                <p class="text-slate-900 dark:text-white">${date}</p>
            </div>
            ${contact.processedAt ? `
                <div>
                    <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Ngày xử lý</label>
                    <p class="text-slate-900 dark:text-white">${processedDate}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('contact-modal').classList.remove('hidden');
}

function markContactProcessed(id) {
    if (typeof updateContactStatus !== 'function') return;
    
    const currentUser = getCurrentUser();
    const result = updateContactStatus(id, 'processed', currentUser?.email || 'admin');
    
    if (result) {
        showMessage('Đã đánh dấu liên hệ là đã xử lý', 'success');
        loadContacts();
    } else {
        showMessage('Có lỗi xảy ra', 'error');
    }
}

function deleteContactAdmin(id) {
    if (confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) {
        if (typeof deleteContact !== 'function') return;
        
        const result = deleteContact(id);
        if (result) {
            showMessage('Đã xóa liên hệ thành công', 'success');
            loadContacts();
        } else {
            showMessage('Có lỗi xảy ra khi xóa', 'error');
        }
    }
}

// ================== FEEDBACKS MANAGEMENT ==================
function loadFeedbacks() {
    if (typeof getFeedbacks !== 'function') {
        console.error('feedback.js chưa được load');
        return;
    }
    
    const feedbacks = getFeedbacks();
    const filterStatus = document.getElementById('filter-feedback-status')?.value || 'all';
    
    let filteredFeedbacks = feedbacks;
    if (filterStatus !== 'all') {
        filteredFeedbacks = feedbacks.filter(f => f.status === filterStatus);
    }
    
    // Sort by date (newest first)
    filteredFeedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    renderFeedbacks(filteredFeedbacks);
}

function renderFeedbacks(feedbacks) {
    const tbody = document.getElementById('feedbacks-table-body');
    if (!tbody) return;
    
    if (feedbacks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <span class="material-symbols-outlined text-4xl mb-2 block">feedback</span>
                    Chưa có phản hồi nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = feedbacks.map(feedback => {
        const date = new Date(feedback.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const stars = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
        const commentPreview = feedback.comment.length > 50 
            ? feedback.comment.substring(0, 50) + '...' 
            : feedback.comment;
        
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-6 py-4 text-sm">
                    <span class="text-lg">${stars}</span>
                    <span class="text-xs text-slate-600 dark:text-slate-400 ml-2">(${feedback.rating}/5)</span>
                </td>
                <td class="px-6 py-4 text-sm">${escapeHtml(commentPreview)}</td>
                <td class="px-6 py-4 text-sm">${feedback.suggestion ? escapeHtml(feedback.suggestion.substring(0, 30) + (feedback.suggestion.length > 30 ? '...' : '')) : '-'}</td>
                <td class="px-6 py-4 text-sm">${feedback.email || '-'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${feedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}">
                        ${feedback.status === 'pending' ? 'Chưa xem' : 'Đã xem'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${date}</td>
                <td class="px-6 py-4 text-sm">
                    <div class="flex gap-2">
                        <button onclick="viewFeedback('${feedback.id}')" class="text-primary hover:text-primary-dark transition-colors" title="Xem chi tiết">
                            <span class="material-symbols-outlined">visibility</span>
                        </button>
                        ${feedback.status === 'pending' ? `
                            <button onclick="markFeedbackReviewed('${feedback.id}')" class="text-blue-600 hover:text-blue-700 transition-colors" title="Đánh dấu đã xem">
                                <span class="material-symbols-outlined">check_circle</span>
                            </button>
                        ` : ''}
                        <button onclick="deleteFeedbackAdmin('${feedback.id}')" class="text-red-600 hover:text-red-700 transition-colors" title="Xóa">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewFeedback(id) {
    if (typeof getFeedbackById !== 'function') return;
    
    const feedback = getFeedbackById(id);
    if (!feedback) {
        showMessage('Không tìm thấy phản hồi', 'error');
        return;
    }
    
    const modalContent = document.getElementById('feedback-modal-content');
    const date = new Date(feedback.createdAt).toLocaleString('vi-VN');
    const stars = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
    
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Đánh giá</label>
                <p class="text-slate-900 dark:text-white text-xl">${stars} (${feedback.rating}/5)</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Nhận xét</label>
                <p class="text-slate-900 dark:text-white whitespace-pre-wrap">${escapeHtml(feedback.comment)}</p>
            </div>
            ${feedback.suggestion ? `
                <div>
                    <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Gợi ý cải thiện</label>
                    <p class="text-slate-900 dark:text-white whitespace-pre-wrap">${escapeHtml(feedback.suggestion)}</p>
                </div>
            ` : ''}
            
            <!-- AI Sentiment Analysis -->
            <div class="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div class="flex items-center justify-between mb-3">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span class="material-symbols-outlined text-green-600">psychology</span>
                        Phân tích AI (Sentiment)
                    </label>
                    <button onclick="analyzeFeedbackSentiment('${id}')" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">refresh</span>
                        Phân tích
                    </button>
                </div>
                <div id="sentiment-result-${id}" class="text-sm text-slate-600 dark:text-slate-400">
                    Nhấn "Phân tích" để xem phân tích cảm xúc AI...
                </div>
            </div>
            
            ${feedback.email ? `
                <div>
                    <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Email</label>
                    <p class="text-slate-900 dark:text-white">${escapeHtml(feedback.email)}</p>
                </div>
            ` : ''}
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Trạng thái</label>
                <p class="text-slate-900 dark:text-white">${feedback.status === 'pending' ? 'Chưa xem' : 'Đã xem'}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Ngày gửi</label>
                <p class="text-slate-900 dark:text-white">${date}</p>
            </div>
        </div>
    `;
    
    document.getElementById('feedback-modal').classList.remove('hidden');
}

function markFeedbackReviewed(id) {
    if (typeof updateFeedbackStatus !== 'function') return;
    
    const currentUser = getCurrentUser();
    const result = updateFeedbackStatus(id, 'reviewed', currentUser?.email || 'admin');
    
    if (result) {
        showMessage('Đã đánh dấu phản hồi là đã xem', 'success');
        loadFeedbacks();
    } else {
        showMessage('Có lỗi xảy ra', 'error');
    }
}

function deleteFeedbackAdmin(id) {
    if (confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) {
        if (typeof deleteFeedback !== 'function') return;
        
        const result = deleteFeedback(id);
        if (result) {
            showMessage('Đã xóa phản hồi thành công', 'success');
            loadFeedbacks();
        } else {
            showMessage('Có lỗi xảy ra khi xóa', 'error');
        }
    }
}

// ================== ESCAPE HTML ==================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================== SHOW MESSAGE ==================
function showMessage(message, type = 'error') {
    const messageContainer = document.getElementById('message-container');
    messageContainer.textContent = message;
    messageContainer.className = `mb-4 p-4 rounded-lg text-sm font-medium ${
        type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    }`;
    messageContainer.classList.remove('hidden');
    
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 3000);
    }
}

// ================== AI SENTIMENT ANALYSIS ==================
async function analyzeContactSentiment(id) {
    if (typeof analyzeSentiment !== 'function') {
        console.error('sentiment-analysis.js chưa được load');
        return;
    }
    
    const contact = getContactById(id);
    if (!contact) return;
    
    const resultDiv = document.getElementById(`sentiment-result-${id}`);
    if (!resultDiv) return;
    
    // Show loading
    resultDiv.innerHTML = `
        <div class="flex items-center gap-2 text-blue-600">
            <span class="material-symbols-outlined animate-spin">progress_activity</span>
            <span>Đang phân tích với Gemini AI...</span>
        </div>
    `;
    
    try {
        const result = await analyzeSentiment(contact.content, 'contact');
        
        resultDiv.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center gap-3">
                    ${getSentimentBadgeHTML(result.sentiment, result.confidence)}
                    ${getPriorityBadgeHTML(result.priority)}
                </div>
                
                <div>
                    <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tóm tắt:</p>
                    <p class="text-sm text-slate-900 dark:text-white">${escapeHtml(result.summary)}</p>
                </div>
                
                ${result.keywords && result.keywords.length > 0 ? `
                    <div>
                        <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Từ khóa:</p>
                        <div class="flex flex-wrap gap-2">
                            ${result.keywords.map(kw => `
                                <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                                    ${escapeHtml(kw)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${result.tags && result.tags.length > 0 ? `
                    <div>
                        <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Tags gợi ý:</p>
                        <div class="flex flex-wrap gap-2">
                            ${result.tags.map(tag => `
                                <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">label</span>
                                    ${escapeHtml(tag)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${result.fallback ? `
                    <p class="text-xs text-orange-600 dark:text-orange-400 italic">
                        ⚠️ Sử dụng phân tích cơ bản (Gemini API không khả dụng)
                    </p>
                ` : `
                    <p class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">verified</span>
                        Powered by Gemini AI
                    </p>
                `}
            </div>
        `;
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        resultDiv.innerHTML = `
            <div class="text-red-600 dark:text-red-400 text-sm">
                ❌ Lỗi phân tích: ${error.message}
            </div>
        `;
    }
}

async function analyzeFeedbackSentiment(id) {
    if (typeof analyzeSentiment !== 'function') {
        console.error('sentiment-analysis.js chưa được load');
        return;
    }
    
    const feedback = getFeedbackById(id);
    if (!feedback) return;
    
    const resultDiv = document.getElementById(`sentiment-result-${id}`);
    if (!resultDiv) return;
    
    // Show loading
    resultDiv.innerHTML = `
        <div class="flex items-center gap-2 text-green-600">
            <span class="material-symbols-outlined animate-spin">progress_activity</span>
            <span>Đang phân tích với Gemini AI...</span>
        </div>
    `;
    
    try {
        const text = feedback.comment + (feedback.suggestion ? ' ' + feedback.suggestion : '');
        const result = await analyzeSentiment(text, 'feedback');
        
        resultDiv.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center gap-3">
                    ${getSentimentBadgeHTML(result.sentiment, result.confidence)}
                    ${getPriorityBadgeHTML(result.priority)}
                </div>
                
                <div>
                    <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tóm tắt:</p>
                    <p class="text-sm text-slate-900 dark:text-white">${escapeHtml(result.summary)}</p>
                </div>
                
                ${result.keywords && result.keywords.length > 0 ? `
                    <div>
                        <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Từ khóa:</p>
                        <div class="flex flex-wrap gap-2">
                            ${result.keywords.map(kw => `
                                <span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs">
                                    ${escapeHtml(kw)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${result.tags && result.tags.length > 0 ? `
                    <div>
                        <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Tags gợi ý:</p>
                        <div class="flex flex-wrap gap-2">
                            ${result.tags.map(tag => `
                                <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">label</span>
                                    ${escapeHtml(tag)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${result.fallback ? `
                    <p class="text-xs text-orange-600 dark:text-orange-400 italic">
                        ⚠️ Sử dụng phân tích cơ bản (Gemini API không khả dụng)
                    </p>
                ` : `
                    <p class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">verified</span>
                        Powered by Gemini AI
                    </p>
                `}
            </div>
        `;
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        resultDiv.innerHTML = `
            <div class="text-red-600 dark:text-red-400 text-sm">
                ❌ Lỗi phân tích: ${error.message}
            </div>
        `;
    }
}
