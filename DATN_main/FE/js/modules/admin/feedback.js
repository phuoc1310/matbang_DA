

function getBackendUrl() {
    return '';
}

async function getFeedbacks() {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/reviews`);
        const result = await response.json();
        if (result.success) {
            return result.reviews;
        } else {
            console.error('Lỗi lấy danh sách đánh giá:', result.error || result.message);
            return [];
        }
    } catch (err) {
        console.error('Lỗi fetch reviews:', err);
        return [];
    }
}

async function getFeedbackById(id) {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/feedbacks/${id}`);
        const result = await response.json();
        if (result.success) {
            return result.feedback;
        }
        return null;
    } catch (err) {
        console.error('Lỗi fetch feedback by id:', err);
        return null;
    }
}

async function updateFeedbackStatus(id, status, byEmail) {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/feedbacks/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const result = await response.json();
        return result.success;
    } catch (err) {
        console.error('Lỗi update feedback status:', err);
        return false;
    }
}

async function deleteFeedback(id) {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/reviews/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        return result.success;
    } catch (err) {
        console.error('Lỗi delete review:', err);
        return false;
    }
}


if (typeof window !== 'undefined') {
    window.getFeedbacks = getFeedbacks;
    window.getFeedbackById = getFeedbackById;
    window.updateFeedbackStatus = updateFeedbackStatus;
    window.deleteFeedback = deleteFeedback;
}
