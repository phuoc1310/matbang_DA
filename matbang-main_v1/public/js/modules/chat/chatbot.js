const CHATBOT_CONFIG = {
    
    USE_GEMINI: true, 
    GEMINI_API_KEY: 'AIzaSyBJh3BzogTLSA7JooEKTE04o1WiiKpInUc', 
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    // Fallback responses khi API không khả dụng
    FALLBACK_MODE: true,
    // Lưu lịch sử chat
    SAVE_HISTORY: true,
    STORAGE_KEY: 'chatbot_history',
    GEMINI_API_KEY_STORAGE: 'gemini_api_key', // Key để lưu API key trong localStorage
    // Rate limiting để tránh 429
    MIN_REQUEST_INTERVAL: 3000, // 3 giây giữa các requests
    MAX_RETRIES: 1,
    RETRY_DELAY: 60000, // 60 giây cho 429 errors
    // Response caching
    CACHE_ENABLED: true,
    CACHE_KEY_PREFIX: 'chatbot_response_',
    CACHE_DURATION: 30 * 60 * 1000, // 30 phút
    QUOTA_EXCEEDED_KEY: 'chatbot_quota_exceeded'
};

// Rate limiting state
let lastRequestTime = 0;
let pendingRequest = false;

// Load Gemini API Key từ localStorage nếu có
function loadGeminiApiKey() {
    const savedKey = localStorage.getItem(CHATBOT_CONFIG.GEMINI_API_KEY_STORAGE);
    if (savedKey) {
        CHATBOT_CONFIG.GEMINI_API_KEY = savedKey;
    }
    return CHATBOT_CONFIG.GEMINI_API_KEY;
}

// Lưu Gemini API Key vào localStorage
function saveGeminiApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
        CHATBOT_CONFIG.GEMINI_API_KEY = apiKey.trim();
        localStorage.setItem(CHATBOT_CONFIG.GEMINI_API_KEY_STORAGE, apiKey.trim());
        return true;
    }
    return false;
}

// ================== INITIALIZE ==================
function initChatbot() {
    // Load Gemini API Key từ localStorage
    loadGeminiApiKey();
    
    // Khôi phục lịch sử chat nếu có
    if (CHATBOT_CONFIG.SAVE_HISTORY) {
        loadChatHistory();
    }
    
    // Thêm welcome message nếu chưa có
    if (!hasChatHistory()) {
        addMessage('bot', 'Xin chào! Tôi là trợ lý AI của SpaceRent. Tôi có thể giúp bạn:\n\n• Tìm kiếm mặt bằng phù hợp\n• Tư vấn về thuê/cho thuê\n• Hướng dẫn sử dụng VIP\n• Trả lời câu hỏi thường gặp\n\nHãy hỏi tôi bất cứ điều gì! 😊');
    }
    
    // Setup event listeners
    setupChatbotEvents();
}

// ================== SETUP EVENTS ==================
function setupChatbotEvents() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const input = document.getElementById('chatbot-input');
    const chatContainer = document.getElementById('chatbot-container');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleChatbot);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeChatbot);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Click outside to close
    if (chatContainer) {
        document.addEventListener('click', (e) => {
            const isOpen = chatContainer.classList.contains('chatbot-open');
            if (isOpen && !chatContainer.contains(e.target) && !toggleBtn?.contains(e.target)) {
                closeChatbot();
            }
        });
    }
}

// ================== TOGGLE CHATBOT ==================
function toggleChatbot(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const chatContainer = document.getElementById('chatbot-container');
    if (!chatContainer) {
        console.error('❌ Chatbot container không tìm thấy!');
        return;
    }
    
    const isOpen = chatContainer.classList.contains('chatbot-open');
    chatContainer.classList.toggle('chatbot-open');
    
    
    const input = document.getElementById('chatbot-input');
    if (input && chatContainer.classList.contains('chatbot-open')) {
        setTimeout(() => {
            input.focus();
            scrollChatToBottom();
        }, 100);
    }
}

function closeChatbot() {
    const chatContainer = document.getElementById('chatbot-container');
    if (chatContainer) {
        chatContainer.classList.remove('chatbot-open');
    }
}

// ================== SEND MESSAGE ==================
async function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input?.value.trim();
    
    if (!message) return;
    
    // Clear input
    if (input) input.value = '';
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Check if request is pending
    if (pendingRequest) {
        hideTypingIndicator();
        addMessage('bot', '⏳ Vui lòng đợi câu hỏi trước hoàn thành...');
        return;
    }
    
    // Get AI response
    try {
        pendingRequest = true;
        const response = await getAIResponse(message);
        hideTypingIndicator();
        addMessage('bot', response);
    } catch (error) {
        console.error('Chatbot error:', error);
        hideTypingIndicator();
        
        // Better error messages
        if (error.message && error.message.includes('429')) {
            addMessage('bot', '⚠️ Đã đạt giới hạn sử dụng API. Vui lòng thử lại sau 1 phút hoặc hỏi các câu hỏi thường gặp về VIP, tìm mặt bằng.');
        } else {
            addMessage('bot', 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hỗ trợ qua email: contact@spacerent.vn');
        }
    } finally {
        pendingRequest = false;
    }
    
    // Save history
    if (CHATBOT_CONFIG.SAVE_HISTORY) {
        saveChatHistory();
    }
    
    // Scroll to bottom
    scrollChatToBottom();
}

// ================== CACHE HELPERS ==================
function getCachedResponse(userMessage) {
    if (!CHATBOT_CONFIG.CACHE_ENABLED) return null;
    
    try {
        const cacheKey = CHATBOT_CONFIG.CACHE_KEY_PREFIX + hashMessage(userMessage);
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const data = JSON.parse(cached);
            // Check if still valid (30 minutes)
            if (Date.now() - data.timestamp < CHATBOT_CONFIG.CACHE_DURATION) {
                return data.response;
            }
        }
    } catch (error) {
        console.warn('Cache read error:', error);
    }
    
    return null;
}

function cacheResponse(userMessage, response) {
    if (!CHATBOT_CONFIG.CACHE_ENABLED) return;
    
    try {
        const cacheKey = CHATBOT_CONFIG.CACHE_KEY_PREFIX + hashMessage(userMessage);
        const data = {
            response: response,
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
        console.warn('Cache write error:', error);
    }
}

function hashMessage(message) {
    // Simple hash function
    let hash = 0;
    const normalized = message.toLowerCase().trim();
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// ================== RATE LIMITING HELPERS ==================
function checkQuotaExceeded() {
    try {
        const quotaData = localStorage.getItem(CHATBOT_CONFIG.QUOTA_EXCEEDED_KEY);
        if (quotaData) {
            const data = JSON.parse(quotaData);
            if (Date.now() < data.until) {
                const remainingSeconds = Math.ceil((data.until - Date.now()) / 1000);
                return { exceeded: true, remainingSeconds };
            } else {
                // Quota expired, clear it
                localStorage.removeItem(CHATBOT_CONFIG.QUOTA_EXCEEDED_KEY);
            }
        }
    } catch (error) {
        console.warn('Quota check error:', error);
    }
    return { exceeded: false };
}

function setQuotaExceeded(seconds) {
    try {
        const data = {
            until: Date.now() + (seconds * 1000)
        };
        localStorage.setItem(CHATBOT_CONFIG.QUOTA_EXCEEDED_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn('Quota set error:', error);
    }
}

function canMakeRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < CHATBOT_CONFIG.MIN_REQUEST_INTERVAL) {
        const waitSeconds = Math.ceil((CHATBOT_CONFIG.MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
        return { canRequest: false, waitSeconds };
    }
    
    return { canRequest: true };
}

// ================== GET AI RESPONSE ==================
async function getAIResponse(userMessage) {
    // Check quota first
    const quotaStatus = checkQuotaExceeded();
    if (quotaStatus.exceeded) {
        return `⏳ API đang tạm nghỉ do vượt quota. Vui lòng thử lại sau ${quotaStatus.remainingSeconds} giây.\n\nTrong lúc chờ đợi, tôi có thể trả lời câu hỏi thường gặp về VIP, tìm mặt bằng, và hướng dẫn sử dụng.`;
    }
    
    // Check rate limiting
    const rateLimit = canMakeRequest();
    if (!rateLimit.canRequest) {
        return `⏱️ Vui lòng đợi ${rateLimit.waitSeconds} giây trước khi gửi câu hỏi tiếp theo để tránh quá tải hệ thống.`;
    }
    
    // Check cache first
    const cachedResponse = getCachedResponse(userMessage);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Update last request time
    lastRequestTime = Date.now();
    
    // Try Gemini API
    if (CHATBOT_CONFIG.USE_GEMINI && CHATBOT_CONFIG.GEMINI_API_KEY) {
        try {
            const geminiResponse = await callGeminiAPI(userMessage);
            if (geminiResponse) {
                // Cache successful response
                cacheResponse(userMessage, geminiResponse);
                return geminiResponse;
            }
        } catch (error) {
            console.warn('Gemini API lỗi:', error);
            
            // Check if 429 error
            if (error.message.includes('429') || error.message.includes('quota')) {
                // Extract retry time if available
                const match = error.message.match(/retry in (\d+)/i);
                const retrySeconds = match ? parseInt(match[1]) : 60;
                
                // Set quota exceeded
                setQuotaExceeded(retrySeconds);
                
                return `⚠️ API đã đạt giới hạn sử dụng. Tôi sẽ chuyển sang chế độ trả lời tự động.\n\n${getFallbackResponse(userMessage)}\n\n💡 Tip: Để trải nghiệm tốt hơn, hãy hỏi các câu hỏi thường gặp về VIP, tìm mặt bằng, hoặc hướng dẫn sử dụng.`;
            }
        }
    }
    
    // Fallback
    return getFallbackResponse(userMessage);
}

// ================== CALL GEMINI API ==================
async function callGeminiAPI(userMessage) {
    const context = getChatContext();
    const backendUrl = localStorage.getItem('chatbot_backend_url') || 'http://localhost:3033';
    
    try {
        const response = await fetch(`${backendUrl}/api/chatbot/gemini`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                context: context
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Backend API error: ${response.status} - ${errorData.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.response) {
            return data.response;
        }
        
        throw new Error(data.message || 'Khong nhan duoc phan hoi tu backend');
    } catch (error) {
        console.error('Loi goi backend API:', error);
        throw error;
    }
}

// ================== FALLBACK RESPONSE ==================
function getFallbackResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    // Câu hỏi về VIP
    if (lowerMsg.includes('vip') || lowerMsg.includes('nâng cấp') || lowerMsg.includes('gia hạn')) {
        return `Về gói VIP của SpaceRent:\n\n✨ **Lợi ích VIP:**\n• Đăng tin VIP nổi bật, hiển thị đầu danh sách\n• Ưu tiên hiển thị trong kết quả tìm kiếm\n• Tăng độ tin cậy và thu hút khách hàng\n\n💰 **Gói VIP:**\n• 1 tháng: 99,000đ\n• 3 tháng: 249,000đ (tiết kiệm 17%)\n• 6 tháng: 449,000đ (tiết kiệm 24%)\n• 12 tháng: 799,000đ (tiết kiệm 33%)\n\nĐể nâng cấp VIP, bạn vào trang tài khoản → tab "Nâng cấp VIP". 💎`;
    }
    
    // Câu hỏi về thuê mặt bằng
    if (lowerMsg.includes('thuê') || lowerMsg.includes('tìm') || lowerMsg.includes('mặt bằng')) {
        return `Để tìm mặt bằng phù hợp:\n\n1. **Sử dụng công cụ tìm kiếm:**\n   • Vào trang "Thuê mặt bằng"\n   • Nhập từ khóa (quận, đường, loại hình)\n   • Lọc theo giá, diện tích, tiện ích\n\n2. **Lọc nâng cao:**\n   • Chọn khu vực cụ thể\n   • Đặt khoảng giá mong muốn\n   • Chọn diện tích phù hợp\n\n3. **Xem chi tiết:**\n   • Click vào tin đăng để xem đầy đủ thông tin\n   • Liên hệ chủ mặt bằng qua số điện thoại\n   • Sử dụng AI tư vấn để đánh giá mặt bằng\n\nBạn muốn tìm mặt bằng ở khu vực nào? 🏢`;
    }
    
    // Câu hỏi về cho thuê
    if (lowerMsg.includes('cho thuê') || lowerMsg.includes('đăng tin')) {
        return `Để đăng tin cho thuê mặt bằng:\n\n1. **Đăng ký tài khoản:**\n   • Chọn role "Chủ mặt bằng"\n   • Điền đầy đủ thông tin\n\n2. **Đăng tin miễn phí:**\n   • Click nút "Đăng tin miễn phí" ở header\n   • Điền thông tin mặt bằng:\n     - Tiêu đề, mô tả\n     - Địa chỉ, diện tích\n     - Giá thuê, hình ảnh\n     - Tiện ích xung quanh\n\n3. **Nâng cấp VIP (tùy chọn):**\n   • Tin VIP hiển thị nổi bật hơn\n   • Thu hút nhiều khách hàng hơn\n\nBạn cần hỗ trợ thêm gì không? 📝`;
    }
    
    // Câu hỏi về giá
    if (lowerMsg.includes('giá') || lowerMsg.includes('phí') || lowerMsg.includes('chi phí')) {
        return `Về giá dịch vụ SpaceRent:\n\n✅ **Miễn phí:**\n• Đăng ký tài khoản\n• Đăng tin cho thuê\n• Tìm kiếm mặt bằng\n• Xem chi tiết tin đăng\n\n💎 **Gói VIP (tùy chọn):**\n• 1 tháng: 99,000đ\n• 3 tháng: 249,000đ\n• 6 tháng: 449,000đ\n• 12 tháng: 799,000đ\n\nVIP giúp tin đăng của bạn nổi bật và thu hút nhiều khách hàng hơn! 💰`;
    }
    
    // Câu hỏi về đăng ký/đăng nhập
    if (lowerMsg.includes('đăng ký') || lowerMsg.includes('đăng nhập') || lowerMsg.includes('tài khoản')) {
        return `Về tài khoản SpaceRent:\n\n📝 **Đăng ký:**\n• Vào trang "Đăng nhập"\n• Chọn tab "Đăng ký"\n• Điền email, mật khẩu, họ tên\n• Chọn role: Người thuê hoặc Chủ mặt bằng\n\n🔐 **Đăng nhập:**\n• Vào trang "Đăng nhập"\n• Nhập email và mật khẩu\n• Click "Đăng nhập"\n\n👤 **Quản lý tài khoản:**\n• Vào "Tài khoản" để:\n  - Xem/chỉnh sửa thông tin\n  - Đổi mật khẩu\n  - Nâng cấp VIP\n  - Xem tin đã lưu\n\nBạn cần hỗ trợ gì về tài khoản? 🤔`;
    }
    
    // Câu hỏi về hỗ trợ
    if (lowerMsg.includes('hỗ trợ') || lowerMsg.includes('liên hệ') || lowerMsg.includes('giúp')) {
        return `Chúng tôi luôn sẵn sàng hỗ trợ bạn! 📞\n\n📧 **Email:** contact@spacerent.vn\n\n💬 **Chatbot:** Bạn đang chat với tôi đây! 😊\n\n⏰ **Thời gian hỗ trợ:** 24/7\n\nBạn có thể hỏi tôi về:\n• Tìm kiếm mặt bằng\n• Đăng tin cho thuê\n• Gói VIP\n• Sử dụng website\n• Bất kỳ câu hỏi nào khác!\n\nHãy cho tôi biết bạn cần hỗ trợ gì nhé! 💪`;
    }
    
    // Câu hỏi chào hỏi
    if (lowerMsg.includes('xin chào') || lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('chào')) {
        return `Xin chào! 👋 Tôi là trợ lý AI của SpaceRent.\n\nTôi có thể giúp bạn:\n• Tìm kiếm mặt bằng phù hợp\n• Tư vấn về thuê/cho thuê\n• Hướng dẫn sử dụng VIP\n• Trả lời câu hỏi về dịch vụ\n\nHãy hỏi tôi bất cứ điều gì! 😊`;
    }
    
    // Câu hỏi về SpaceRent
    if (lowerMsg.includes('spacerent') || lowerMsg.includes('website') || lowerMsg.includes('nền tảng')) {
        return `SpaceRent là nền tảng kết nối không gian kinh doanh hàng đầu Việt Nam. 🏢\n\n**Chức năng chính:**\n• Tìm kiếm mặt bằng thuê\n• Đăng tin cho thuê\n• Tư vấn AI thông minh\n• Gói VIP nổi bật\n\n**Đối tượng:**\n• Người thuê: Tìm mặt bằng kinh doanh\n• Chủ mặt bằng: Cho thuê mặt bằng\n\nBạn muốn biết thêm gì về SpaceRent? 🌟`;
    }
    
    // Default response
    return `Cảm ơn bạn đã hỏi! 🤔\n\nTôi hiểu bạn đang hỏi về: "${message}"\n\nHiện tại tôi đang ở chế độ demo. Để được hỗ trợ tốt hơn, bạn có thể:\n\n1. **Hỏi các câu hỏi cụ thể hơn** về:\n   • Tìm kiếm mặt bằng\n   • Đăng tin cho thuê\n   • Gói VIP\n   • Đăng ký/đăng nhập\n\n2. **Liên hệ hỗ trợ:**\n   📧 Email: contact@spacerent.vn\n\nBạn muốn hỏi gì tiếp theo? 💬`;
}

// ================== GET CHAT CONTEXT ==================
function getChatContext() {
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const currentPage = window.location.pathname;
    
    return {
        user: currentUser ? {
            role: currentUser.role,
            email: currentUser.email
        } : null,
        page: currentPage,
        timestamp: new Date().toISOString()
    };
}

// ================== ADD MESSAGE ==================
function addMessage(sender, text) {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message chatbot-message-${sender}`;
    
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="chatbot-message-content">
            ${sender === 'bot' ? '<span class="chatbot-avatar">🤖</span>' : ''}
            <div class="chatbot-text">
                ${formatMessage(text)}
            </div>
            ${sender === 'user' ? '<span class="chatbot-avatar">👤</span>' : ''}
        </div>
        <div class="chatbot-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollChatToBottom();
}

// ================== FORMAT MESSAGE ==================
function formatMessage(text) {
    // Format markdown-like syntax
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/•/g, '•');
}

// ================== TYPING INDICATOR ==================
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'chatbot-typing';
    typingDiv.className = 'chatbot-message chatbot-message-bot';
    typingDiv.innerHTML = `
        <div class="chatbot-message-content">
            <span class="chatbot-avatar">🤖</span>
            <div class="chatbot-typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollChatToBottom();
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById('chatbot-typing');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// ================== SCROLL TO BOTTOM ==================
function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// ================== CHAT HISTORY ==================
function saveChatHistory() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;
    
    const messages = [];
    const messageElements = messagesContainer.querySelectorAll('.chatbot-message:not(#chatbot-typing)');
    
    messageElements.forEach(msg => {
        const isBot = msg.classList.contains('chatbot-message-bot');
        const textElement = msg.querySelector('.chatbot-text');
        if (textElement) {
            messages.push({
                sender: isBot ? 'bot' : 'user',
                text: textElement.textContent,
                time: msg.querySelector('.chatbot-time')?.textContent || ''
            });
        }
    });
    
    localStorage.setItem(CHATBOT_CONFIG.STORAGE_KEY, JSON.stringify(messages));
}

function loadChatHistory() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;
    
    try {
        const historyStr = localStorage.getItem(CHATBOT_CONFIG.STORAGE_KEY);
        if (!historyStr) return;
        
        const messages = JSON.parse(historyStr);
        messagesContainer.innerHTML = '';
        
        messages.forEach(msg => {
            addMessage(msg.sender, msg.text);
        });
    } catch (error) {
        console.error('Lỗi load lịch sử chat:', error);
    }
}

function hasChatHistory() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return false;
    return messagesContainer.children.length > 0;
}

function clearChatHistory() {
    localStorage.removeItem(CHATBOT_CONFIG.STORAGE_KEY);
    const messagesContainer = document.getElementById('chatbot-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
    initChatbot();
}

// ================== GEMINI API KEY SETUP ==================
// Hàm để setup Gemini API Key (có thể gọi từ console hoặc UI)
function setupGeminiAPIKey(apiKey) {
    if (saveGeminiApiKey(apiKey)) {
        console.log('✅ Đã lưu Gemini API Key thành công!');
        return true;
    } else {
        console.error('❌ API Key không hợp lệ');
        return false;
    }
}

// Hàm để kiểm tra Gemini API Key có hợp lệ không
async function testGeminiAPIKey(apiKey) {
    if (!apiKey || !apiKey.trim()) {
        return { success: false, message: 'API Key không được để trống' };
    }
    
    const originalKey = CHATBOT_CONFIG.GEMINI_API_KEY;
    CHATBOT_CONFIG.GEMINI_API_KEY = apiKey.trim();
    
    try {
        const testResponse = await callGeminiAPI('Xin chào');
        CHATBOT_CONFIG.GEMINI_API_KEY = originalKey;
        return { success: true, message: 'API Key hợp lệ!', response: testResponse };
    } catch (error) {
        CHATBOT_CONFIG.GEMINI_API_KEY = originalKey;
        return { success: false, message: `API Key không hợp lệ: ${error.message}` };
    }
}

// Hàm để lấy trạng thái cấu hình Gemini
function getGeminiConfigStatus() {
    return {
        useGemini: CHATBOT_CONFIG.USE_GEMINI,
        hasApiKey: !!CHATBOT_CONFIG.GEMINI_API_KEY,
        apiKeyLength: CHATBOT_CONFIG.GEMINI_API_KEY ? CHATBOT_CONFIG.GEMINI_API_KEY.length : 0,
        apiUrl: CHATBOT_CONFIG.GEMINI_API_URL
    };
}

// ================== EXPORT ==================
if (typeof window !== 'undefined') {
    window.initChatbot = initChatbot;
    window.toggleChatbot = toggleChatbot;
    window.closeChatbot = closeChatbot;
    window.sendMessage = sendMessage;
    window.clearChatHistory = clearChatHistory;
    // Gemini API functions
    window.setupGeminiAPIKey = setupGeminiAPIKey;
    window.testGeminiAPIKey = testGeminiAPIKey;
    window.getGeminiConfigStatus = getGeminiConfigStatus;
    window.loadGeminiApiKey = loadGeminiApiKey;
    window.saveGeminiApiKey = saveGeminiApiKey;
}
