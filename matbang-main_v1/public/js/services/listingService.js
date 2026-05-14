import { auth } from '../config/firebase.js';

// Helper function to get token and set headers
async function getAuthHeaders() {
    const user = auth.currentUser;
    if (!user) throw new Error('Vui lòng đăng nhập để thực hiện tính năng này');
    
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function createListing(data) {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/listings', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Lỗi khi đăng tin');
    }
    
    return res.json();
}

export async function updateListing(id, data) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Lỗi khi cập nhật tin đăng');
    }
    
    return res.json();
}

export async function getListings({ userId, limit = 100, page = 1 }) {
    // Nếu có userId, ta gửi lên server để chỉ lấy tin của user đó
    let url = `/api/listings?limit=${limit}&page=${page}`;
    if (userId) {
        url += `&user_id=${userId}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Lỗi khi tải danh sách tin');
    }
    
    const json = await res.json();
    // API trả về { data: [...], total, ... }
    return json.data || [];
}

export async function getListingById(id) {
    const res = await fetch(`/api/listings/${id}`);
    if (!res.ok) throw new Error('Không tìm thấy tin đăng');
    return res.json();
}

export async function deleteListing(id) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Lỗi khi xóa tin');
    }
}

export function normalizeListing(listing) {
    return {
        ...listing,
        price_string: listing.price ? `${Number(listing.price).toLocaleString('vi-VN')} VNĐ` : 'Thỏa thuận',
    };
}

export async function toggleListingVisibility(id) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/listings/${id}/visibility`, {
        method: 'PATCH',
        headers
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Lỗi khi đổi trạng thái hiển thị');
    }
}

export async function updateListingStatus(id, newStatus, reason) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/listings/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus, reason })
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Lỗi khi đổi trạng thái tin');
    }
}

export async function getListingHistory(id) {
    // Backend chưa hỗ trợ History thực sự, tạm trả về rỗng để giao diện không lỗi
    return [];
}
