// Xử lý đăng nhập, đăng ký, đăng xuất, lưu trạng thái user
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const userWelcome = document.getElementById("userWelcome");
const logoutBtn = document.getElementById("logoutBtn");
const chatContainer = document.querySelector(".chat-container");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

function setUser(username) {
  localStorage.setItem("chatbox_user", username);
  userWelcome.textContent = "Xin chào, " + username;
  logoutBtn.classList.remove("d-none");
  loginBtn.classList.add("d-none");
  registerBtn.classList.add("d-none");
  chatContainer.classList.remove("d-none");
}

function clearUser() {
  localStorage.removeItem("chatbox_user");
  userWelcome.textContent = "";
  logoutBtn.classList.add("d-none");
  loginBtn.classList.remove("d-none");
  registerBtn.classList.remove("d-none");
  chatContainer.classList.add("d-none");
}

function getUser() {
  return localStorage.getItem("chatbox_user");
}

// Đăng nhập
loginForm?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setUser(username);
      document.getElementById("loginError").textContent = "";
      bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
    } else {
      document.getElementById("loginError").textContent =
        data.message || data.error || "Lỗi đăng nhập!";
    }
  } catch (err) {
    document.getElementById("loginError").textContent = "Lỗi kết nối server!";
  }
});

// Đăng ký
registerForm?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;
  try {
    const res = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setUser(username);
      document.getElementById("registerError").textContent = "";
      bootstrap.Modal.getInstance(
        document.getElementById("registerModal")
      ).hide();
    } else {
      document.getElementById("registerError").textContent =
        data.message || data.error || "Lỗi đăng ký!";
    }
  } catch (err) {
    document.getElementById("registerError").textContent =
      "Lỗi kết nối server!";
  }
});

// Đăng xuất
logoutBtn?.addEventListener("click", function () {
  clearUser();
});

// Kiểm tra trạng thái đăng nhập khi load trang
function checkLogin() {
  if (getUser()) {
    setUser(getUser());
  } else {
    clearUser();
  }
}
checkLogin();
