// public/js/modules/admin/sentiment-analysis.js

const SENTIMENT_CACHE_KEY = 'spacerent_sentiment_cache';

// Mock AI analysis (Basic fallback if no actual API integration is provided)
function basicAnalyze(text) {
    const lowerText = text.toLowerCase();
    
    // Simple dictionaries
    const positiveWords = ['đẹp', 'tuyệt vời', 'nhanh chóng', 'tốt', 'hiệu quả', 'ok', 'hài lòng', 'thích', 'tiện lợi'];
    const negativeWords = ['chậm', 'lỗi', 'không', 'tệ', 'kém', 'khó chịu', 'bực', 'phức tạp', 'đắt'];
    const urgentWords = ['lỗi', 'ngay', 'khẩn cấp', 'không thể', 'mất tiền', 'scam', 'lừa đảo', 'hư'];

    let posCount = 0;
    let negCount = 0;
    let urgentCount = 0;

    positiveWords.forEach(w => { if (lowerText.includes(w)) posCount++; });
    negativeWords.forEach(w => { if (lowerText.includes(w)) negCount++; });
    urgentWords.forEach(w => { if (lowerText.includes(w)) urgentCount++; });

    let sentiment = 'neutral';
    if (posCount > negCount) sentiment = 'positive';
    if (negCount > posCount) sentiment = 'negative';

    let priority = 'medium';
    if (urgentCount > 0 || sentiment === 'negative') priority = 'high';
    if (sentiment === 'positive' && urgentCount === 0) priority = 'low';

    return {
        sentiment: sentiment,
        confidence: 0.85, // Mock confidence
        priority: priority,
        summary: text.length > 50 ? text.substring(0, 50) + '...' : text,
        keywords: [positiveWords.find(w => lowerText.includes(w)) || negativeWords.find(w => lowerText.includes(w)) || 'chung chung'].filter(Boolean),
        tags: [sentiment, priority],
        fallback: true
    };
}

async function analyzeSentiment(text, type) {
    // In a real application, you would call your backend AI route here.
    // E.g., await fetch('/api/admin/analyze', { method: 'POST', body: JSON.stringify({text}) })
    
    return new Promise((resolve) => {
        setTimeout(() => {
            const result = basicAnalyze(text);
            
            // Cache result
            const cache = getCache();
            cache[text] = result;
            saveCache(cache);
            
            resolve(result);
        }, 1000); // simulate API delay
    });
}

async function analyzeBatch(items, type) {
    const results = [];
    for (const item of items) {
        const text = type === 'feedback' 
            ? (item.comment + (item.suggestion ? ' ' + item.suggestion : ''))
            : item.content;
            
        const result = await analyzeSentiment(text, type);
        results.push(result);
    }
    return results;
}

function getCache() {
    const data = localStorage.getItem(SENTIMENT_CACHE_KEY);
    return data ? JSON.parse(data) : {};
}

function saveCache(cache) {
    localStorage.setItem(SENTIMENT_CACHE_KEY, JSON.stringify(cache));
}

function getCachedSentiment(text) {
    const cache = getCache();
    return cache[text] || null;
}

function getSentimentBadgeHTML(sentiment, confidence) {
    if (sentiment === 'positive') {
        return `<span class="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-xs font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-xs">sentiment_satisfied</span>Tích cực</span>`;
    } else if (sentiment === 'negative') {
        return `<span class="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-xs font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-xs">sentiment_dissatisfied</span>Tiêu cực</span>`;
    } else {
        return `<span class="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 rounded text-xs font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-xs">sentiment_neutral</span>Trung lập</span>`;
    }
}

function getPriorityBadgeHTML(priority) {
    if (priority === 'high') {
        return `<span class="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-xs font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-xs">priority_high</span>Ưu tiên cao</span>`;
    } else if (priority === 'low') {
        return `<span class="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-xs font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-xs">low_priority</span>Ưu tiên thấp</span>`;
    } else {
        return `<span class="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded text-xs font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-xs">drag_handle</span>Bình thường</span>`;
    }
}

// Export to global scope
if (typeof window !== 'undefined') {
    window.analyzeSentiment = analyzeSentiment;
    window.analyzeBatch = analyzeBatch;
    window.getCachedSentiment = getCachedSentiment;
    window.getSentimentBadgeHTML = getSentimentBadgeHTML;
    window.getPriorityBadgeHTML = getPriorityBadgeHTML;
}
