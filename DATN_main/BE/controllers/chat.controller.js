import fetch from "node-fetch";
import db from "../config/db.js";

// Semantic Caching (Bộ nhớ đệm ngữ nghĩa - In-memory dùng cho Demo/Bảo vệ đồ án)
const semanticCache = new Map();

export const askAI = async (req, res) => {
  const { conversation, conversation_id, user } = req.body;
  
  let userMessage = conversation && conversation.length > 0 
    ? conversation[conversation.length - 1].content 
    : "";

  if (!userMessage) {
    return res.status(400).json({ answer: "Tin nhắn không hợp lệ" });
  }

  // --- SEMANTIC CACHING ---
  // Kiểm tra cache nếu đây là tin nhắn mới (chưa có context conversation_id)
  const cacheKey = userMessage.toLowerCase().trim();
  if (!conversation_id && semanticCache.has(cacheKey)) {
    console.log("[Semantic Cache] Trả về kết quả có sẵn cho câu hỏi:", cacheKey);
    return res.json(semanticCache.get(cacheKey));
  }

  const DIFY_API_KEY = process.env.DIFY_API_KEY;
  
  if (!DIFY_API_KEY) {
    console.error("Thiếu DIFY_API_KEY trong file .env");
    return res.status(500).json({ answer: "Lỗi cấu hình server (Thiếu API Key)" });
  }

  
  if (!conversation_id) {
    try {
      
      let searchCity = null;
      const msgLower = userMessage.toLowerCase();
      if (msgLower.includes("hà nội") || msgLower.includes("hanoi")) searchCity = "Hà Nội";
      else if (msgLower.includes("hồ chí minh") || msgLower.includes("hcm") || msgLower.includes("sài gòn")) searchCity = "Hồ Chí Minh";
      else if (msgLower.includes("đà nẵng")) searchCity = "Đà Nẵng";

      
      let targetPrice = null;
      let matchTy = msgLower.match(/([0-9\.,]+)\s*tỷ/);
      if (matchTy) {
        targetPrice = parseFloat(matchTy[1].replace(/,/g, '.')) * 1000000000;
      } else {
        let matchTrieu = msgLower.match(/([0-9\.,]+)\s*(triệu|tr\b)/);
        if (matchTrieu) {
          targetPrice = parseFloat(matchTrieu[1].replace(/,/g, '.')) * 1000000;
        }
      }

      
      let targetArea = null;
      let matchArea = msgLower.match(/([0-9\.,]+)\s*(m2|mét vuông)/);
      if (matchArea) {
         targetArea = parseFloat(matchArea[1].replace(/,/g, '.'));
      }

      
      let query = `SELECT * FROM listings WHERE is_visible = true AND status = 'approved' AND price < 100000000000`;
      let params = [];
      let paramIdx = 1;

      if (searchCity) {
        query += ` AND city = $${paramIdx++}`;
        params.push(searchCity);
      }

      let orderClauses = [];

      
      
      orderClauses.push(`(CASE WHEN LOWER($${paramIdx}) LIKE '%' || REPLACE(REPLACE(LOWER(COALESCE(district, '')), 'quận ', ''), 'huyện ', '') || '%' AND LENGTH(COALESCE(district, '')) > 2 THEN 0 ELSE 1 END) ASC`);
      params.push(userMessage);
      paramIdx++;

      
      if (targetPrice) {
        orderClauses.push(`ABS(price - $${paramIdx++}) ASC`);
        params.push(targetPrice);
      }

      
      if (targetArea) {
        orderClauses.push(`ABS(area - $${paramIdx++}) ASC`);
        params.push(targetArea);
      }

      if (orderClauses.length > 0) {
        query += ` ORDER BY ${orderClauses.join(', ')}, RANDOM() LIMIT 30`;
      } else {
        query += ` ORDER BY RANDOM() LIMIT 30`;
      }

      const result = await db.query(query, params);
      const listings = result.rows || [];
      
      const listingsText = listings.map(l => 
        `- ID: ${l.id}, Tiêu đề: ${l.title}, Giá: ${l.price} VNĐ, Diện tích: ${l.area}m2, Địa chỉ: ${l.address}, ${l.ward}, ${l.district}, ${l.city}, Loại: ${l.type}, Hình ảnh: ${l.image || 'https://placehold.co/600x400/cccccc/666666?text=No+Image'}`
      ).join("\n");

      
      userMessage = `[HỆ THỐNG: Dưới đây là danh sách các mặt bằng thực tế đang có trong Database. Hãy dựa vào đây để tư vấn. Nếu bạn gợi ý một mặt bằng, BẮT BUỘC phải hiển thị Hình ảnh mặt bằng đó bằng cú pháp Markdown: ![Ảnh]({link hình ảnh}) và định dạng in đậm tên mặt bằng. Chú ý chỉ dùng dữ liệu này làm kiến thức ngầm, không tự lặp lại phần hệ thống này cho khách biết]
${listingsText}

[NGƯỜI DÙNG HỎI]: ${userMessage}`;
    } catch (e) {
      console.error("Lỗi khi lấy dữ liệu mặt bằng cho Dify:", e);
    }
  }

  const payload = {
    inputs: {},
    query: userMessage,
    response_mode: "blocking",
    conversation_id: conversation_id || "",
    user: user || "web-widget",
    files: []
  };

  // --- CƠ CHẾ RETRY & FALLBACK (Chống Rate Limit 429) ---
  let difyData = null;
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const difyRes = await fetch("https://api.dify.ai/v1/chat-messages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DIFY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // Nếu bị giới hạn request (Rate Limit) -> Chờ rồi gọi lại
      if (difyRes.status === 429) {
        if (attempt === maxRetries - 1) throw new Error("Rate limit exceeded");
        console.warn(`[AI Chatbot] Bị giới hạn tốc độ, thử lại lần ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1500)); // Exponential backoff
        continue;
      }

      if (!difyRes.ok) {
        const errorText = await difyRes.text();
        console.error("Lỗi từ Dify API:", errorText);
        return res.status(500).json({ answer: "Xin lỗi, hiện tại AI đang gặp sự cố. Vui lòng thử lại sau." });
      }

      difyData = await difyRes.json();
      break; // Lấy thành công thì thoát vòng lặp Retry
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error("Lỗi mạng/Rate Limit khi gọi Dify API:", error);
        return res.status(500).json({ answer: "Bot hiện đang bận do có quá nhiều người truy cập. Vui lòng thử lại sau ít phút." });
      }
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1500));
    }
  }

  const finalResponse = {
    answer: difyData.answer || "(AI không có phản hồi)",
    conversation_id: difyData.conversation_id
  };

  // Lưu vào Semantic Cache (TTL: 1 tiếng)
  if (!conversation_id) {
    semanticCache.set(cacheKey, finalResponse);
    setTimeout(() => semanticCache.delete(cacheKey), 3600000); // Tự xóa sau 1 giờ
  }

  res.json(finalResponse);
};
