// public/js/modules/admin/contact.js

function getBackendUrl() {
    return '';
}

async function getContacts() {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/contacts`);
        const result = await response.json();
        if (result.success) {
            return result.contacts;
        } else {
            console.error('Lỗi lấy danh sách liên hệ:', result.error || result.message);
            return [];
        }
    } catch (err) {
        console.error('Lỗi fetch contacts:', err);
        return [];
    }
}

async function getContactById(id) {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/contacts/${id}`);
        const result = await response.json();
        if (result.success) {
            return result.contact;
        }
        return null;
    } catch (err) {
        console.error('Lỗi fetch contact by id:', err);
        return null;
    }
}

async function updateContactStatus(id, status, byEmail) {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/contacts/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const result = await response.json();
        return result.success;
    } catch (err) {
        console.error('Lỗi update contact status:', err);
        return false;
    }
}

async function deleteContact(id) {
    try {
        const response = await fetch(`${getBackendUrl()}/api/admin/contacts/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        return result.success;
    } catch (err) {
        console.error('Lỗi delete contact:', err);
        return false;
    }
}

// Export to global scope
if (typeof window !== 'undefined') {
    window.getContacts = getContacts;
    window.getContactById = getContactById;
    window.updateContactStatus = updateContactStatus;
    window.deleteContact = deleteContact;
}
