


import { setUserAsAdmin, removeAdminRole, logout } from "/js/modules/auth/auth.js?v=1.0.6";


function validatePhone(phone) {
    return /^[0-9]{10,11}$/.test(phone.replace(/\s/g, ""));
}

// Helper function to get backend URL
function getBackendUrl() {
    return '';
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
        const backendUrl = '';
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
    const userCount = allUsers.filter(u => u.role === 'user' || u.role !== 'admin').length;
    const adminCount = allUsers.filter(u => u.role === 'admin').length;
    
    // Update statistics cards if they exist (for backward compatibility)
    const statTotal = document.getElementById('stat-total');
    const statNguoithue = document.getElementById('stat-nguoithue'); // Still mapped to "Người dùng" if the UI wasn't changed
    
    if (statTotal) statTotal.textContent = total;
    if (statNguoithue) statNguoithue.textContent = userCount;
}


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
        
        let roleBadge = '';
        if (user.role === 'admin') {
            roleBadge = '<span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-semibold">Admin</span>';
        } else {
            roleBadge = '<span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-semibold">Người dùng</span>';
        }
        
        const vipBadge = user.vipStatus
            ? '<span class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-semibold">VIP</span>'
            : '<span class="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs font-semibold">Thường</span>';
        
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A';
        const displayId = String(user.id);
        
        
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
                    <span class="text-sm text-slate-900 dark:text-white font-mono">${displayId}</span>
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
    
    filteredUsers = allUsers.filter(user => {
        
        const matchesSearch = !searchTerm || 
            (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.phone && user.phone.includes(searchTerm)) ||
            user.id.toLowerCase().includes(searchTerm);
        
        
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });
    
    renderUsers();
}


function viewUserDetail(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showMessage('Không tìm thấy người dùng.', 'error');
        return;
    }
    
    let roleText = 'Người dùng';
    if (user.role === 'admin') {
        roleText = 'Quản trị viên';
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


let editingUserId = null;

function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showMessage('Không tìm thấy người dùng.', 'error');
        return;
    }
    
    
    if (user.role === 'admin') {
        showMessage('Không thể chỉnh sửa thông tin admin từ đây. Vui lòng dùng trang tài khoản cá nhân.', 'error');
        return;
    }
    
    editingUserId = userId;
    
    
    document.getElementById('edit-user-fullName').value = user.fullName || '';
    document.getElementById('edit-user-phone').value = user.phone || '';
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-address').value = user.address || '';
    document.getElementById('edit-user-role').value = user.role === 'admin' ? 'user' : user.role;
    
    
    document.getElementById('edit-modal').classList.remove('hidden');
}


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
    
    
    if (newPhone && !validatePhone(newPhone)) {
        showMessage('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 số.', 'error');
        return;
    }
    
    
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
            
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === editingUserId) {
                const updatedUser = { ...currentUser, fullName: newFullName, phone: newPhone, address: newAddress, role: newRole };
                sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
            
            await loadUsers(); 
            showMessage('Cập nhật thông tin người dùng thành công!', 'success');
            
            
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


async function deleteUser(userId) {
    try {
        const user = allUsers.find(u => u.id === userId);
        
        
        if (user && user.role === 'admin') {
            showMessage('Không thể xóa tài khoản admin. Vui lòng gỡ quyền admin trước.', 'error');
            return;
        }
        
        const response = await fetch(`${getBackendUrl()}/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                sessionStorage.removeItem('currentUser');
            }
            
            await loadUsers(); 
            showMessage('Xóa tài khoản thành công!', 'success');
        } else {
            throw new Error(result.message || 'Loi xoa');
        }
    } catch (error) {
        console.error('Lỗi xóa người dùng:', error);
        showMessage('Đã xảy ra lỗi khi xóa tài khoản.', 'error');
    }
}


let adminActionUserId = null;
let adminActionType = null; 

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


function setupEventListeners() {
    
    document.getElementById('search-input').addEventListener('input', filterUsers);
    
    
    document.getElementById('filter-role').addEventListener('change', filterUsers);
    
    
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('user-modal').classList.add('hidden');
    });
    
    
    document.getElementById('user-modal').addEventListener('click', (e) => {
        if (e.target.id === 'user-modal') {
            document.getElementById('user-modal').classList.add('hidden');
        }
    });
    
    
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
    
    
    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target.id === 'delete-modal') {
            document.getElementById('delete-modal').classList.add('hidden');
            userToDelete = null;
        }
    });
    
    
    document.getElementById('close-edit-modal').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.add('hidden');
        editingUserId = null;
    });
    
    document.getElementById('cancel-edit-user').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.add('hidden');
        editingUserId = null;
    });
    
    
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            document.getElementById('edit-modal').classList.add('hidden');
            editingUserId = null;
        }
    });
    
    
    document.getElementById('edit-user-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditedUser();
    });
    
    
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
    
    
    document.getElementById('admin-modal').addEventListener('click', (e) => {
        if (e.target.id === 'admin-modal') {
            document.getElementById('admin-modal').classList.add('hidden');
            adminActionUserId = null;
            adminActionType = null;
        }
    });
    
    
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
    
    
    

    
    const filterFeedbackStatus = document.getElementById('filter-feedback-status');
    if (filterFeedbackStatus) {
        filterFeedbackStatus.addEventListener('change', () => {
            loadFeedbacks();
        });
    }
    
    
    document.querySelectorAll('.close-contact-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('contact-modal').classList.add('hidden');
        });
    });
    
    
    document.querySelectorAll('.close-feedback-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('feedback-modal').classList.add('hidden');
        });
    });
}


function setupNavigation() {
    
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            navigateTo(tabName);
        });
    });
    
    
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }
}

async function navigateTo(sectionName) {
    
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.nav === sectionName) {
            item.className = 'nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors bg-primary/10 text-primary border-l-4 border-primary';
        } else {
            item.className = 'nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800';
        }
    });
    
    
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Tổng quan hệ thống' },
        users: { title: 'Quản lý người dùng', subtitle: 'Danh sách và thông tin người dùng' },
        feedbacks: { title: 'Quản lý phản hồi', subtitle: 'Đánh giá và góp ý từ người dùng' },
        listings: { title: 'Quản lý tin đăng', subtitle: 'Duyệt, từ chối và quản lý tất cả tin đăng' }
    };
    
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    if (pageTitle && titles[sectionName]) {
        pageTitle.textContent = titles[sectionName].title;
        pageSubtitle.textContent = titles[sectionName].subtitle;
    }
    
    
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    const activeSection = document.getElementById(`section-${sectionName}`);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }
    
    
    if (sectionName === 'dashboard') {
        if (typeof initDashboard === 'function') {
            initDashboard();
        }
    } else if (sectionName === 'users') {
        await loadUsers();
    } else if (sectionName === 'feedbacks') {
        await loadFeedbacks();
    } else if (sectionName === 'listings') {
        await loadAdminListings();
    }
    
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
    }
}


window.navigateTo = navigateTo;
window.viewUserDetail = viewUserDetail;
window.editUser = editUser;
window.confirmDeleteUser = confirmDeleteUser;
window.confirmSetAdmin = confirmSetAdmin;
window.confirmRemoveAdmin = confirmRemoveAdmin;
window.saveEditedUser = saveEditedUser;
window.deleteUser = deleteUser;

window.viewFeedback = viewFeedback;
window.deleteFeedbackAdmin = deleteFeedbackAdmin;
window.analyzeFeedbackSentiment = analyzeFeedbackSentiment;
window.adminApproveListing = adminApproveListing;
window.adminRejectListing = adminRejectListing;
window.adminDeleteListing = adminDeleteListing;
window.adminViewListing = adminViewListing;

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



// ================== FEEDBACKS MANAGEMENT ==================
async function loadFeedbacks() {
    if (typeof getFeedbacks !== 'function') {
        console.error('feedback.js chưa được load');
        return;
    }
    
    const feedbacks = await getFeedbacks();
    const filterStatus = document.getElementById('filter-feedback-status')?.value || 'all';
    
    let filteredFeedbacks = feedbacks;
    if (filterStatus !== 'all') {
        filteredFeedbacks = feedbacks.filter(f => f.status === filterStatus);
    }
    
    
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
        
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= feedback.rating) {
                stars += '<span class="material-symbols-outlined text-yellow-400 text-sm">star</span>';
            } else {
                stars += '<span class="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">star</span>';
            }
        }
        
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-1 mb-1">${stars}</div>
                    <span class="text-xs text-slate-500 dark:text-slate-400">(${feedback.rating}/5)</span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-slate-900 dark:text-white line-clamp-2" title="${escapeHtml(feedback.comment || '')}">${escapeHtml(feedback.comment || 'Không có nhận xét')}</p>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-900 dark:text-white">${escapeHtml(feedback.userName || 'Người dùng')}</div>
                    <div class="text-xs text-slate-500">${escapeHtml(feedback.email || '')}</div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm font-medium text-slate-900 dark:text-white line-clamp-2" title="${escapeHtml(feedback.listingTitle || '')}">${escapeHtml(feedback.listingTitle || 'Mặt bằng đã xóa')}</p>
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

async function viewFeedback(id) {
    if (typeof getFeedbackById !== 'function') return;
    
    const feedback = await getFeedbackById(id);
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
                <p class="text-slate-900 dark:text-white whitespace-pre-wrap">${escapeHtml(feedback.comment || 'Không có nhận xét')}</p>
            </div>
            
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
            
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Người dùng</label>
                <p class="text-slate-900 dark:text-white">${escapeHtml(feedback.userName || 'Người dùng')}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Email</label>
                <p class="text-slate-900 dark:text-white">${escapeHtml(feedback.email || 'Không có')}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Mặt bằng</label>
                <p class="text-slate-900 dark:text-white font-medium">${escapeHtml(feedback.listingTitle || 'Mặt bằng đã xóa')}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-400">Ngày gửi</label>
                <p class="text-slate-900 dark:text-white">${date}</p>
            </div>
        </div>
    `;
    
    document.getElementById('feedback-modal').classList.remove('hidden');
}

async function markFeedbackReviewed(id) {
    if (typeof updateFeedbackStatus !== 'function') return;
    
    const currentUser = getCurrentUser();
    const result = await updateFeedbackStatus(id, 'reviewed', currentUser?.email || 'admin');
    
    if (result) {
        showMessage('Đã đánh dấu phản hồi là đã xem', 'success');
        await loadFeedbacks();
    } else {
        showMessage('Có lỗi xảy ra', 'error');
    }
}

async function deleteFeedbackAdmin(id) {
    if (confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) {
        if (typeof deleteFeedback !== 'function') return;
        
        const result = await deleteFeedback(id);
        if (result) {
            showMessage('Đã xóa phản hồi thành công', 'success');
            await loadFeedbacks();
        } else {
            showMessage('Có lỗi xảy ra khi xóa', 'error');
        }
    }
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


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


async function analyzeContactSentiment(id) {
    if (typeof analyzeSentiment !== 'function') {
        console.error('sentiment-analysis.js chưa được load');
        return;
    }
    
    const contact = getContactById(id);
    if (!contact) return;
    
    const resultDiv = document.getElementById(`sentiment-result-${id}`);
    if (!resultDiv) return;
    
    
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

// ================== LISTINGS MANAGEMENT (ADMIN) ==================
let adminListings = [];
let adminListingsDebounce = null;
let adminListingsPage = 1;
const adminListingsLimit = 50;

async function loadAdminListings(resetPage = false) {
    const backendUrl = getBackendUrl();
    const status = document.getElementById('listing-filter-status')?.value || 'all';
    const search = document.getElementById('listing-search-input')?.value || '';

    if (resetPage) {
        adminListingsPage = 1;
    }

    try {
        const params = new URLSearchParams({ status, search, limit: adminListingsLimit, page: adminListingsPage });
        const response = await fetch(`${backendUrl}/api/admin/listings?${params}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.listings) {
            if (resetPage) {
                adminListings = result.listings;
            } else {
                adminListings = [...adminListings, ...result.listings];
            }
            renderAdminListings(adminListings);
            fetchAndRenderListingStats();

            const label = document.getElementById('listing-count-label');
            if (label) label.textContent = `Hiển thị ${adminListings.length} / ${result.total} tin`;

            const loadMoreBtn = document.getElementById('load-more-listings');
            if (loadMoreBtn) {
                if (adminListingsPage < result.totalPages) {
                    loadMoreBtn.classList.remove('hidden');
                } else {
                    loadMoreBtn.classList.add('hidden');
                }
            }
        } else {
            throw new Error(result.error || 'Không nhận được dữ liệu');
        }
    } catch (error) {
        console.error('Lỗi tải tin đăng:', error);
        showMessage('Không thể tải danh sách tin đăng.', 'error');
    }
}

async function fetchAndRenderListingStats() {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/listings/stats`);
        const result = await response.json();
        if (result.success && result.stats) {
            const stats = result.stats;
            const elTotal = document.getElementById('stat-total-listings');
            const elPending = document.getElementById('stat-pending-listings');
            const elApproved = document.getElementById('stat-approved-listings');
            const elRejected = document.getElementById('stat-rejected-listings');

            if (elTotal) elTotal.textContent = stats.total;
            if (elPending) elPending.textContent = stats.pending;
            if (elApproved) elApproved.textContent = stats.approved;
            if (elRejected) elRejected.textContent = stats.rejected;
        }
    } catch (error) {
        console.error('Lỗi tải thống kê:', error);
    }
}

function renderAdminListings(listings) {
    const tbody = document.getElementById('listings-table-body');
    const noResults = document.getElementById('listings-no-results');
    if (!tbody) return;

    if (listings.length === 0) {
        tbody.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
        return;
    }

    if (noResults) noResults.classList.add('hidden');

    tbody.innerHTML = listings.map(listing => {
        const statusBadges = {
            pending: '<span class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-semibold">Chờ duyệt</span>',
            approved: '<span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-semibold">Đã duyệt</span>',
            rejected: '<span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-semibold">Từ chối</span>'
        };
        const statusBadge = statusBadges[listing.status] || statusBadges.pending;

        const price = listing.price ? Number(listing.price).toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận';
        const createdAt = listing.created_at ? new Date(listing.created_at).toLocaleDateString('vi-VN') : 'N/A';
        const userName = listing.user_name || listing.user_email || 'Ẩn danh';
        const currentStatus = listing.status || 'pending';

        
        let actionBtns = `
            <button onclick="adminViewListing(${listing.id})" class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Xem chi tiết">
                <span class="material-symbols-outlined text-[18px]">visibility</span>
            </button>`;

        if (currentStatus === 'pending') {
            actionBtns += `
            <button onclick="adminApproveListing(${listing.id})" class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Duyệt tin">
                <span class="material-symbols-outlined text-[18px]">check_circle</span>
            </button>
            <button onclick="adminRejectListing(${listing.id})" class="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors" title="Từ chối">
                <span class="material-symbols-outlined text-[18px]">cancel</span>
            </button>`;
        } else if (currentStatus === 'approved') {
            actionBtns += `
            <button onclick="adminRejectListing(${listing.id})" class="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors" title="Từ chối">
                <span class="material-symbols-outlined text-[18px]">cancel</span>
            </button>`;
        } else if (currentStatus === 'rejected') {
            actionBtns += `
            <button onclick="adminApproveListing(${listing.id})" class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Duyệt lại">
                <span class="material-symbols-outlined text-[18px]">check_circle</span>
            </button>`;
        }

        actionBtns += `
            <button onclick="adminDeleteListing(${listing.id})" class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Xóa">
                <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>`;

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-slate-900 dark:text-white font-mono">${listing.id}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-900 dark:text-white max-w-[250px] truncate" title="${String(listing.title || '').replace(/"/g, '&quot;')}">${listing.title || 'Không có tiêu đề'}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">${listing.address || ''}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-slate-900 dark:text-white">${userName}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-primary">${price}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${statusBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-600 dark:text-slate-400">${createdAt}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex gap-1">${actionBtns}</div>
                </td>
            </tr>
        `;
    }).join('');
}

async function adminApproveListing(id) {
    if (!confirm('Bạn có chắc chắn muốn DUYỆT tin đăng này?')) return;

    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/listings/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
        });
        const result = await response.json();
        if (result.success) {
            showMessage('Đã duyệt tin đăng thành công!', 'success');
            await loadAdminListings();
        } else {
            throw new Error(result.message || 'Lỗi duyệt tin');
        }
    } catch (error) {
        console.error('Error approving listing:', error);
        showMessage('Lỗi khi duyệt tin: ' + error.message, 'error');
    }
}

async function adminRejectListing(id) {
    const reason = prompt('Lý do từ chối tin đăng (để trống nếu không có):');
    if (reason === null) return; 

    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/listings/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', reason: reason || '' })
        });
        const result = await response.json();
        if (result.success) {
            showMessage('Đã từ chối tin đăng.', 'success');
            await loadAdminListings();
        } else {
            throw new Error(result.message || 'Lỗi từ chối tin');
        }
    } catch (error) {
        console.error('Error rejecting listing:', error);
        showMessage('Lỗi khi từ chối tin: ' + error.message, 'error');
    }
}

async function adminDeleteListing(id) {
    if (!confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN tin đăng này? Hành động này không thể hoàn tác.')) return;

    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/listings/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            showMessage('Đã xóa tin đăng thành công!', 'success');
            await loadAdminListings();
        } else {
            throw new Error(result.message || 'Lỗi xóa tin');
        }
    } catch (error) {
        console.error('Error deleting listing:', error);
        showMessage('Lỗi khi xóa tin: ' + error.message, 'error');
    }
}

function adminViewListing(id) {
    const listing = adminListings.find(l => l.id === id);
    if (!listing) {
        showMessage('Không tìm thấy tin đăng.', 'error');
        return;
    }

    const statusLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
    const price = listing.price ? Number(listing.price).toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận';
    const createdAt = listing.created_at ? new Date(listing.created_at).toLocaleString('vi-VN') : 'N/A';
    const userName = listing.user_name || listing.user_email || 'Ẩn danh';
    const imgSrc = listing.image || 'https://placehold.co/600x400?text=No+Image';

    const modalContent = document.getElementById('user-modal-content');
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="relative h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img src="${imgSrc}" alt="${listing.title}" referrerpolicy="no-referrer" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Tiêu đề</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${listing.title || 'N/A'}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Người đăng</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${userName}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Giá</p>
                    <p class="text-sm font-medium text-primary">${price}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Diện tích</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${listing.area || 0} m²</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg col-span-2">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Địa chỉ</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${listing.address || 'Chưa có'}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Trạng thái</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${statusLabels[listing.status] || 'Chờ duyệt'}</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Ngày tạo</p>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">${createdAt}</p>
                </div>
                ${listing.description ? `
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg col-span-2">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Mô tả</p>
                    <p class="text-sm text-slate-900 dark:text-white whitespace-pre-line">${listing.description}</p>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    
    const modalTitle = document.querySelector('#user-modal h3');
    if (modalTitle) modalTitle.textContent = 'Chi tiết tin đăng';
    document.getElementById('user-modal').classList.remove('hidden');
}


document.addEventListener('DOMContentLoaded', () => {
    const listingSearch = document.getElementById('listing-search-input');
    const listingFilter = document.getElementById('listing-filter-status');
    const loadMoreBtn = document.getElementById('load-more-listings');

    if (listingSearch) {
        listingSearch.addEventListener('input', () => {
            clearTimeout(adminListingsDebounce);
            adminListingsDebounce = setTimeout(() => loadAdminListings(true), 400);
        });
    }

    if (listingFilter) {
        listingFilter.addEventListener('change', () => loadAdminListings(true));
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            adminListingsPage++;
            loadAdminListings(false);
        });
    }
});

