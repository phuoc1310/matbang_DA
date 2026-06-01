import fetch from "node-fetch";

export const askAI = async (req, res) => {
  const { conversation, conversation_id, user } = req.body;
  
  const userMessage = conversation && conversation.length > 0 
    ? conversation[conversation.length - 1].content 
    : "";

  if (!userMessage) {
    return res.status(400).json({ answer: "Tin nhắn không hợp lệ" });
  }

  const DIFY_API_KEY = process.env.DIFY_API_KEY;
  
  if (!DIFY_API_KEY) {
    console.error("Thiếu DIFY_API_KEY trong file .env");
    return res.status(500).json({ answer: "Lỗi cấu hình server (Thiếu API Key)" });
  }

  const payload = {
    inputs: {},
    query: userMessage,
    response_mode: "blocking",
    conversation_id: conversation_id || "",
    user: user || "web-widget",
    files: []
  };

  const difyRes = await fetch("https://api.dify.ai/v1/chat-messages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!difyRes.ok) {
    const errorText = await difyRes.text();
    console.error("Lỗi từ Dify API:", errorText);
    return res.status(500).json({ answer: "Xin lỗi, hiện tại AI đang gặp sự cố. Vui lòng thử lại sau." });
  }

  const difyData = await difyRes.json();

  res.json({
    answer: difyData.answer || "(AI không có phản hồi)",
    conversation_id: difyData.conversation_id
  });
};
