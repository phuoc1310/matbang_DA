// public/js/modules/admin/feedback.js

function getBackendUrl() {
    return '';
}

async function getFeedbacks() {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/feedbacks`);
        const result = await response.json();
        if (result.success) {
            return result.feedbacks;
        } else {
            console.error('Lỗi lấy danh sách phản hồi:', result.error || result.message);
            return [];
        }
    } catch (err) {
        console.error('Lỗi fetch feedbacks:', err);
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
        const response = await fetch(`${getBackendUrl()}/api/admin/feedbacks/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        return result.success;
    } catch (err) {
        console.error('Lỗi delete feedback:', err);
        return false;
    }
}

// Export to global scope
if (typeof window !== 'undefined') {
    window.getFeedbacks = getFeedbacks;
    window.getFeedbackById = getFeedbackById;
    window.updateFeedbackStatus = updateFeedbackStatus;
    window.deleteFeedback = deleteFeedback;
}
