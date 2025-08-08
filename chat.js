// Xử lý chat gửi qua NiFi, đợi phản hồi trả về
const chatHistory = document.getElementById("chatHistory");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const PORT = process.env.PORT;
function createMessageElement(text, sender = "user") {
  const msg = document.createElement("div");
  msg.className = "message " + sender;
  msg.textContent = text;
  return msg;
}

function addMessageToChat(text, sender = "user") {
  const msgElement = createMessageElement(text, sender);
  chatHistory.appendChild(msgElement);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function handleUserMessage(text) {
  addMessageToChat(text, "user");
  sendToServer(text);
}

async function sendToServer(text) {
  const username = localStorage.getItem("chatbox_user");
  if (!username) {
    addMessageToChat("⚠️ Bạn cần đăng nhập để chat!", "other");
    return;
  }

  try {
    console.log(username);
    const response = await fetch(`http://localhost:${PORT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        message: text,
        createdAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      addMessageToChat(data.error || "❌ Lỗi gửi tin nhắn!", "other");
      return;
    }

    // Đợi phản hồi từ webhook (server sẽ trả về khi có emitter)
    const data = await response.json();
    if (data.reply) {
      addMessageToChat(data.reply.reply, "other");
    } else {
      addMessageToChat("(Không có phản hồi từ AI)", "other");
    }
  } catch (err) {
    addMessageToChat("❌ Lỗi gửi đến máy chủ: " + err.message, "other");
  }
}

chatForm?.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (text) {
    handleUserMessage(text);
    chatInput.value = "";
  }
});
