const db = require('../config/db');
const session = require("express-session");
const bcrypt = require('bcryptjs');

// ===== Farmer Register (Plain Text) =====
exports.fregister = (req, res) => {
  const { name, email, village, password } = req.body;

  if (!name || !email || !village || !password) {
    return res.render("fregister", { msg: "All fields are required!", msg_type: "error" });
  }

  // Check if email already exists
  db.query("SELECT * FROM farmers WHERE email = ?", [email], async (err, result) => {
    if (err) {
      console.log("DB Error:", err);
      return res.render("fregister", { msg: "Database error", msg_type: "error" });
    }

    if (result.length > 0) {
      return res.render("fregister", { msg: "Email already registered!", msg_type: "error" });
    }

    // Insert new farmer (hashed password)
    const hash = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO farmers SET ?",
      { name, village, email, password: hash },
      (err2) => {
        if (err2) {
          console.log("DB Error:", err2);
          return res.render("fregister", { msg: "Error saving data!", msg_type: "error" });
        }
        return res.render("flogin", { msg: "Registration successful! Please login.", msg_type: "success" });
      }
    );
  });
};

// ===== Farmer Login (Plain Text) =====
exports.flogin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("flogin", { msg: "Email and Password required!", msg_type: "error" });
  }

  db.query("SELECT * FROM farmers WHERE email = ?", [email], async (err, result) => {
    if (err) {
      console.log("DB Error:", err);
      return res.render("flogin", { msg: "Database error", msg_type: "error" });
    }

    if (result.length === 0) {
      return res.render("flogin", { msg: "Invalid email or password!", msg_type: "error" });
    }

    const match = await bcrypt.compare(password, result[0].password);
    if (!match) {
      return res.render("flogin", { msg: "Invalid email or password!", msg_type: "error" });
    }

    // ✅ Ensure session exists
    if (req.session) {
      req.session.farmer = {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email
      };
    }

    return res.render("fdashboard", { 
      msg: "Login successful!", 
      msg_type: "success", 
      farmer: result[0] 
    });
  });
};