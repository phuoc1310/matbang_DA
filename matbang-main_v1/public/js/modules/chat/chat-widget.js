(function () {
  // ====== CONFIG ======
  const WEBHOOK_URL = "https://ph215.app.n8n.cloud/webhook/ask-ai";
  // ====================

  let chatOpen = false;
  let conversation = [];
  let conversationId = "";

  // Inject HTML
  document.body.insertAdjacentHTML("beforeend", `
    <div id="chat-widget-btn">💬</div>

    <div id="chat-widget">
      <div id="chat-header">
        🤖 AI Tư vấn mặt bằng
        <span id="chat-close" style="cursor:pointer">✕</span>
      </div>
      <div id="chat-body"></div>
      <div id="chat-input">
        <textarea id="chat-text" rows="2" placeholder="Nhập tin nhắn..."></textarea>
        <button id="chat-send">➤</button>
      </div>
    </div>
  `);

  const chatBtn = document.getElementById("chat-widget-btn");
  const chatBox = document.getElementById("chat-widget");
  const chatClose = document.getElementById("chat-close");
  const chatBody = document.getElementById("chat-body");
  const chatText = document.getElementById("chat-text");
  const chatSend = document.getElementById("chat-send");

  chatBtn.onclick = toggleChat;
  chatClose.onclick = toggleChat;
  chatSend.onclick = sendChat;

  function toggleChat() {
    chatOpen = !chatOpen;
    chatBox.style.display = chatOpen ? "flex" : "none";
  }

  async function sendChat() {
    const text = chatText.value.trim();
    if (!text) return;

    chatBody.innerHTML += `
      <div class="msg-user">
        <div class="bubble user-bubble">${text}</div>
      </div>
    `;
    chatBody.scrollTop = chatBody.scrollHeight;

    conversation.push({ role: "user", content: text });
    chatText.value = "";

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation,
          conversation_id: conversationId,
          user: "web-widget"
        })
      });

      const data = await res.json();
      const answer = data.answer || "(AI không trả lời)";

      chatBody.innerHTML += `
        <div class="msg-ai">
          <div class="bubble ai-bubble">${answer}</div>
        </div>
      `;
      chatBody.scrollTop = chatBody.scrollHeight;

      conversation.push({ role: "assistant", content: answer });

      if (data.conversation_id) {
        conversationId = data.conversation_id;
      }

    } catch (e) {
      chatBody.innerHTML += `
        <div class="msg-ai">
          <div class="bubble ai-bubble">❌ Không kết nối được AI</div>
        </div>
      `;
    }
  }
})();
