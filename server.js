require("dotenv").config(); // Nạp biến môi trường từ file .env
const path = require("path");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const oracledb = require("oracledb");

const app = express();
app.use(cors());
app.use(express.json());

// === Oracle Client ===
oracledb.initOracleClient({
  libDir: process.env.ORACLE_CLIENT_PATH,
});

// === Oracle DB Config ===
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING,
};

// === API: ĐĂNG KÝ ===
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Thiếu username hoặc password" });

  try {
    const conn = await oracledb.getConnection(dbConfig);
    const check = await conn.execute(
      `SELECT * FROM WF_SENDER_HIEU WHERE USERNAME = :username`,
      [username]
    );
    if (check.rows.length > 0) {
      await conn.close();
      return res.json({ success: false, message: "Tài khoản đã tồn tại" });
    }
    await conn.execute(
      `INSERT INTO WF_SENDER_HIEU (USERNAME, PASSWORD) VALUES (:username, :password)`,
      [username, password],
      { autoCommit: true }
    );
    await conn.close();
    res.json({ success: true, message: "Đăng ký thành công" });
  } catch (err) {
    console.error("Đăng ký lỗi:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === API: ĐĂNG NHẬP ===
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Thiếu username hoặc password" });

  try {
    const conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT * FROM WF_SENDER_HIEU WHERE USERNAME = :u AND PASSWORD = :p`,
      [username, password]
    );
    await conn.close();

    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ" });
  }
});

// === API: GỬI TIN NHẮN ĐẾN NIFI ===
app.post("/api/chat", async (req, res) => {
  const { username, message } = req.body;
  if (!username || !message)
    return res.status(400).json({ error: "Thiếu username hoặc message" });

  // Kiểm tra đăng nhập
  try {
    const conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT * FROM WF_SENDER_HIEU WHERE USERNAME = :u`,
      [username]
    );
    await conn.close();
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ error: "Bạn chưa đăng nhập hoặc tài khoản không tồn tại" });
    }
  } catch (err) {
    console.error("Lỗi kiểm tra đăng nhập:", err);
    return res.status(500).json({ error: "Lỗi kiểm tra đăng nhập" });
  }

  try {
    const nifiResponse = await axios.post(
      process.env.NIFI_URL,
      { username, message },
      { timeout: 60000 }
    );

    res.json({
      success: true,
      reply: nifiResponse.data,
    });
  } catch (err) {
    if (err.response) {
      console.error("Lỗi từ NiFi:", err.response.status, err.response.data);
    } else if (err.request) {
      console.error("Không nhận được phản hồi từ NiFi:", err.message);
    } else {
      console.error("Lỗi gửi tới NiFi:", err.message);
    }
    res.status(500).json({ error: "Lỗi gọi NiFi: " + err.message });
  }
});
app.use(express.static(path.join(__dirname)));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// === SERVER KHỞI ĐỘNG ===
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
