// public/asset/js/quanly.js

import { auth } from './auth/firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firestore } from './auth/firebase.js';
import { 
  getListings, 
  deleteListing, 
  normalizeListing,
  toggleListingVisibility,
  updateListingStatus,
  getListingHistory
} from './listingService.js';
import { openListingForm } from './listingForm.js';

let currentUser = null;
let allListings = [];
let filteredListings = [];

window.editListing = async function(id) {
  try {
    const { getListingById } = await import('./listingService.js');
    const listing = await getListingById(id);
    const { openListingForm } = await import('./listingForm.js');
    openListingForm(listing);
  } catch (error) {
    console.error('Error loading listing:', error);
    alert('Lỗi tải thông tin tin đăng: ' + error.message);
  }
};

window.deleteListingConfirm = function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa tin đăng này?')) {
    return;
  }
  deleteListingHandler(id);
};

async function deleteListingHandler(id) {
  try {
    await deleteListing(id);
    alert('Đã xóa tin đăng thành công');
    await loadListings();
  } catch (error) {
    console.error('Error deleting listing:', error);
    alert('Lỗi xóa tin đăng: ' + error.message);
  }
}

window.toggleVisibility = async function(id, currentVisibility) {
  try {
    await toggleListingVisibility(id);
    alert(`Đã ${currentVisibility ? 'ẩn' : 'hiển thị'} tin đăng thành công`);
    await loadListings();
  } catch (error) {
    console.error('Error toggling visibility:', error);
    alert('Lỗi thay đổi trạng thái hiển thị: ' + error.message);
  }
};

window.changeStatus = async function(id, newStatus) {
  const statusLabels = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối'
  };
  
  const reason = prompt(`Lý do thay đổi trạng thái thành "${statusLabels[newStatus]}":`, '');
  if (reason === null) return;

  try {
    await updateListingStatus(id, newStatus, reason || '');
    alert(`Đã thay đổi trạng thái thành "${statusLabels[newStatus]}" thành công`);
    await loadListings();
  } catch (error) {
    console.error('Error changing status:', error);
    alert('Lỗi thay đổi trạng thái: ' + error.message);
  }
};

window.viewHistory = async function(id) {
  try {
    const histories = await getListingHistory(id);
    
    const listing = allListings.find(l => l.id === id);
    const title = listing ? listing.title : 'Tin đăng #' + id;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-4">
        <div class="p-6 border-b border-border-light dark:border-border-dark">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
              <span class="material-symbols-outlined align-middle">history</span>
              Lịch sử chỉnh sửa
            </h2>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              <span class="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">${title}</p>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          ${histories.length === 0 ? `
            <div class="text-center py-12">
              <span class="material-symbols-outlined text-5xl text-gray-400 mb-4">history</span>
              <p class="text-slate-600 dark:text-slate-400">Chưa có lịch sử chỉnh sửa</p>
            </div>
          ` : histories.map(history => {
            const date = new Date(history.createdAt);
            const formattedDate = date.toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return `
              <div class="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4 border-primary">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-white">
                      ${history.userName || 'Hệ thống'}
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${formattedDate}</p>
                  </div>
                  ${history.reason ? `
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                      ${history.reason}
                    </span>
                  ` : ''}
                </div>
                ${history.oldData && history.newData ? `
                  <div class="mt-3 text-sm">
                    ${Object.keys(history.newData || {}).filter(key => 
                      JSON.stringify(history.oldData[key]) !== JSON.stringify(history.newData[key]) &&
                      !['updatedAt', 'createdAt'].includes(key)
                    ).map(key => {
                      const oldVal = history.oldData[key];
                      const newVal = history.newData[key];
                      const keyLabels = {
                        title: 'Tiêu đề',
                        price: 'Giá',
                        status: 'Trạng thái',
                        isVisible: 'Hiển thị',
                        description: 'Mô tả',
                        address: 'Địa chỉ'
                      };
                      return `
                        <div class="mb-2">
                          <span class="font-semibold text-slate-700 dark:text-slate-300">${keyLabels[key] || key}:</span>
                          <span class="text-red-600 dark:text-red-400 line-through ml-2">${oldVal || 'N/A'}</span>
                          <span class="text-green-600 dark:text-green-400 ml-2">→ ${newVal || 'N/A'}</span>
                        </div>
                      `;
                    }).join('') || '<p class="text-slate-500 dark:text-slate-400">Không có thay đổi chi tiết</p>'}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error('Error loading history:', error);
    alert('Lỗi tải lịch sử: ' + error.message);
  }
};

const userName = document.getElementById('user-name');
const btnLogout = document.getElementById('btn-logout');
const btnCreateListing = document.getElementById('btnCreateListing');
const btnCreateListingEmpty = document.getElementById('btnCreateListingEmpty');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const listingsContainer = document.getElementById('listingsContainer');
const filterTabs = document.querySelectorAll('.filter-tab');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Vui lòng đăng nhập để quản lý tin đăng');
    window.location.href = 'dangnhap.html';
    return;
  }

  currentUser = user;
  
  if (userName) {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userName.textContent = userData.displayName || user.email || 'Thanh vien';
      } else {
        userName.textContent = user.email || 'Thanh vien';
      }
    } catch (error) {
      userName.textContent = user.email || 'Thanh vien';
    }
  }

  await loadListings();
});

async function loadListings() {
  try {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    listingsContainer.classList.add('hidden');

    const listings = await getListings({ 
      userId: currentUser.uid,
      limit: 100 
    });

    allListings = listings.map(listing => normalizeListing(listing));
    filteredListings = [...allListings];

    renderListings();
    
    setActiveFilter('all');

  } catch (error) {
    console.error('Error loading listings:', error);
    alert('Lỗi tải danh sách tin đăng: ' + error.message);
  } finally {
    loadingState.classList.add('hidden');
  }
}

function renderListings() {
  if (filteredListings.length === 0) {
    emptyState.classList.remove('hidden');
    listingsContainer.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  listingsContainer.classList.remove('hidden');

  listingsContainer.innerHTML = filteredListings.map(listing => {
    const statusBadge = getStatusBadge(listing.status);
    const featuredBadge = listing.featured 
      ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Nổi bật</span>'
      : '';

    return `
      <div class="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden hover:shadow-lg transition-all">
        <div class="relative h-48 bg-gray-200 dark:bg-gray-700">
          <img src="${listing.image || 'https://placehold.co/600x400?text=No+Image'}" 
               alt="${listing.title}" 
               class="w-full h-full object-cover"
               onerror="this.src='https://placehold.co/600x400?text=No+Image'">
          <div class="absolute top-2 right-2 flex gap-2">
            ${featuredBadge}
            ${statusBadge}
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem]">
            ${listing.title}
          </h3>
          <div class="flex items-end gap-1 text-primary font-black text-lg mb-2">
            ${listing.price_string}
          </div>
          <div class="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-xs mb-4">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">square_foot</span>
              ${listing.area_m2 || 0} m²
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">category</span>
              ${listing.businessType || 'N/A'}
            </span>
          </div>
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-4">
            <span class="material-symbols-outlined text-[16px]">location_on</span>
            <span class="truncate">${listing.address || 'Chưa có địa chỉ'}</span>
          </div>
          <div class="space-y-2 pt-4 border-t border-border-light dark:border-border-dark">
            <div class="flex gap-2">
              <button onclick="editListing('${listing.id}')" 
                      class="flex-1 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
                <span class="material-symbols-outlined text-[16px] align-middle">edit</span>
                Sửa
              </button>
              <button onclick="deleteListingConfirm('${listing.id}')" 
                      class="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors">
                <span class="material-symbols-outlined text-[16px] align-middle">delete</span>
                Xóa
              </button>
            </div>
            <div class="flex gap-2">
              <button onclick="toggleVisibility('${listing.id}', ${listing.isVisible})" 
                      class="flex-1 px-3 py-2 ${listing.isVisible ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600'} text-white text-sm font-semibold rounded-lg transition-colors">
                <span class="material-symbols-outlined text-[16px] align-middle">${listing.isVisible ? 'visibility_off' : 'visibility'}</span>
                ${listing.isVisible ? 'Ẩn' : 'Hiện'}
              </button>
              <button onclick="viewHistory('${listing.id}')" 
                      class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">
                <span class="material-symbols-outlined text-[16px] align-middle">history</span>
                Lịch sử
              </button>
            </div>
            ${listing.status === 'pending' ? `
            <div class="flex gap-2">
              <button onclick="changeStatus('${listing.id}', 'approved')" 
                      class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <span class="material-symbols-outlined text-[16px] align-middle">check_circle</span>
                Duyệt
              </button>
              <button onclick="changeStatus('${listing.id}', 'rejected')" 
                      class="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
                <span class="material-symbols-outlined text-[16px] align-middle">cancel</span>
                Từ chối
              </button>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  window.loadListings = loadListings;
}

function getStatusBadge(status) {
  const badges = {
    pending: '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Chờ duyệt</span>',
    approved: '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Đã duyệt</span>',
    rejected: '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Từ chối</span>'
  };
  return badges[status] || badges.pending;
}

function setActiveFilter(status) {
  filterTabs.forEach(tab => {
    if (tab.dataset.status === status) {
      tab.classList.add('border-b-2', 'border-primary', 'text-primary');
      tab.classList.remove('text-slate-600', 'dark:text-slate-400');
    } else {
      tab.classList.remove('border-b-2', 'border-primary', 'text-primary');
      tab.classList.add('text-slate-600', 'dark:text-slate-400');
    }
  });

  if (status === 'all') {
    filteredListings = [...allListings];
  } else {
    filteredListings = allListings.filter(listing => listing.status === status);
  }

  renderListings();
}

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    setActiveFilter(tab.dataset.status);
  });
});

if (btnCreateListing) {
  btnCreateListing.addEventListener('click', () => {
    openListingForm();
  });
}

if (btnCreateListingEmpty) {
  btnCreateListingEmpty.addEventListener('click', () => {
    openListingForm();
  });
}

if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'Trangchu.html';
  });
}
